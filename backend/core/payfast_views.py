"""
Saving a card with Payfast, and charging it afterwards.

Three doors, and only one of them is reachable without a session:

  start   - a signed-in client asks for the form that sends them to Payfast
  notify  - Payfast tells us what happened (no session, verified instead)
  return  - where Payfast sends the client's browser afterwards

The token arrives on the notification, never on the return URL, because a
browser redirect is something anybody can type into a bar. Everything that
changes money or stores a token happens in `notify`.
"""

from __future__ import annotations

import logging
from decimal import Decimal

from django.db import transaction
from django.shortcuts import redirect
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.conf import settings
from django.http import HttpResponse

from . import payfast
from .models import ClientAccount, Invoice, Payment

logger = logging.getLogger(__name__)

# What the client agrees to. Stored verbatim against the account, so that in
# a dispute we can show the words rather than describe them.
CONSENT_TEXT = (
    "I authorise {company} to charge this card for my monthly invoice on or "
    "after the first of each month, for as long as my account is active. I "
    "can remove the card at any time from my billing page."
)


def _account_for(request) -> ClientAccount | None:
    return ClientAccount.objects.filter(user=request.user).first()


class PayfastStartView(APIView):
    """Hand back the form fields that send this client to Payfast.

    The browser posts them itself. We never redirect with the fields in a
    query string, because the signature would then be in somebody's history.
    """

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not payfast.is_configured():
            return Response(
                {
                    "configured": False,
                    "detail": "Card payments are not switched on yet.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        account = _account_for(request)
        if account is None:
            return Response(
                {"detail": "No account on this login."}, status=status.HTTP_404_NOT_FOUND
            )

        # Pay the oldest unpaid invoice while we are here. If there is
        # nothing owed, the card is saved for nothing, which Payfast allows.
        invoice = (
            Invoice.objects.filter(
                account=account,
                status__in=[Invoice.Status.DUE, Invoice.Status.OVERDUE],
            )
            .order_by("issued_on", "id")
            .first()
        )
        amount = invoice.amount if invoice else Decimal("0.00")

        payment = None
        if invoice is not None:
            payment = Payment.objects.create(
                invoice=invoice,
                provider="payfast",
                amount=amount,
                currency=invoice.currency,
            )

        name = (account.contact or account.company_name or "").strip()
        first, _, last = name.partition(" ")
        base = settings.PORTAL_URL.rstrip("/")

        checkout = payfast.checkout(
            payment_id=payment.reference if payment else f"card-{account.pk}",
            amount=amount,
            item_name=invoice.number if invoice else "Card setup",
            item_description=(
                invoice.period_label if invoice and invoice.period_label else "Saving your card"
            ),
            first_name=first or "Client",
            last_name=last or "",
            email=account.invoice_email or request.user.email,
            return_url=f"{base}/api/billing/payfast/return/",
            cancel_url=f"{base}/account/billing?payment=cancelled",
            notify_url=f"{base}/api/billing/payfast/notify/",
        )

        # Record what they agreed to at the moment they agreed to it.
        account.card_consent_text = CONSENT_TEXT.format(company=settings.COMPANY_NAME)
        account.save(update_fields=["card_consent_text", "updated_at"])

        return Response(
            {
                "configured": True,
                "action": checkout.action,
                "fields": checkout.fields,
                "amount": str(amount),
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
class PayfastNotifyView(APIView):
    """Payfast's ITN. Not a session, so everything is verified instead."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        posted = {key: value for key, value in request.POST.items()}
        if not payfast.verify_itn(posted):
            # Nothing is written on a notification we cannot prove came
            # from Payfast.
            return HttpResponse(status=401)

        if posted.get("payment_status") != "COMPLETE":
            logger.info("Payfast ITN ignored: status %s", posted.get("payment_status"))
            return HttpResponse("OK")

        reference = posted.get("m_payment_id", "")
        token = posted.get("token", "")

        with transaction.atomic():
            payment = (
                Payment.objects.select_for_update()
                .filter(reference=reference, provider="payfast")
                .select_related("invoice", "invoice__account")
                .first()
            )

            account = None
            if payment is not None:
                account = payment.invoice.account
                if payment.status != Payment.Status.SUCCEEDED:
                    paid = Decimal(posted.get("amount_gross", "0") or "0")
                    # Settle only what was actually paid for. A mismatch is
                    # either a tampered ITN or a partial payment, and both
                    # want a human rather than a paid invoice.
                    if paid >= payment.amount:
                        payment.status = Payment.Status.SUCCEEDED
                        payment.provider_reference = posted.get("pf_payment_id", "")
                        payment.provider_payload = posted
                        payment.save()

                        invoice = payment.invoice
                        if invoice.status != Invoice.Status.PAID:
                            invoice.status = Invoice.Status.PAID
                            invoice.paid_at = timezone.now()
                            invoice.save(
                                update_fields=["status", "paid_at", "updated_at"]
                            )
                    else:
                        logger.warning(
                            "Payfast ITN amount %s under invoice %s", paid, payment.amount
                        )
            elif reference.startswith("card-"):
                account = ClientAccount.objects.filter(pk=reference[5:]).first()

            # A tokenization agreement sends the token once, here.
            if account is not None and token:
                account.payfast_token = token
                account.card_saved_at = timezone.now()
                account.save(update_fields=["payfast_token", "card_saved_at", "updated_at"])

        return HttpResponse("OK")


class PayfastReturnView(APIView):
    """Where the client's browser lands. Tells them nothing we have not
    already confirmed with Payfast on the notification."""

    permission_classes = [AllowAny]

    def get(self, request):
        return redirect(f"{settings.PORTAL_URL}/account/billing?payment=pending")


class SavedCardView(APIView):
    """Read, switch off, or remove the saved card."""

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        account = _account_for(request)
        if account is None:
            return Response({"detail": "No account."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self._state(account))

    def patch(self, request):
        account = _account_for(request)
        if account is None:
            return Response({"detail": "No account."}, status=status.HTTP_404_NOT_FOUND)

        if "autopay" in request.data:
            account.autopay = bool(request.data["autopay"])
            account.save(update_fields=["autopay", "updated_at"])
        return Response(self._state(account))

    def delete(self, request):
        account = _account_for(request)
        if account is None:
            return Response({"detail": "No account."}, status=status.HTTP_404_NOT_FOUND)

        account.payfast_token = ""
        account.card_saved_at = None
        account.autopay = False
        account.save(
            update_fields=["payfast_token", "card_saved_at", "autopay", "updated_at"]
        )
        return Response(self._state(account))

    @staticmethod
    def _state(account: ClientAccount) -> dict:
        return {
            "has_card": bool(account.payfast_token),
            "saved_at": account.card_saved_at,
            "autopay": account.autopay,
            "update_url": (
                payfast.update_card_url(account.payfast_token)
                if account.payfast_token
                else ""
            ),
            "consent_text": account.card_consent_text,
        }
