"""Billing for the client portal: invoices and taking a payment through Paystack.

An invoice is only ever marked paid after asking Paystack directly what
happened. The webhook is signed and the signature is checked, but it is treated
as a nudge to go and look, never as the answer itself. That way a forged or
replayed callback cannot settle an invoice.
"""

import logging

from django.conf import settings
from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import paystack
from .models import Invoice, Payment
from .serializers import InvoiceSerializer

logger = logging.getLogger(__name__)


class _ClientScopedMixin:
    """Limits every query to the signed-in client's own rows.

    Without this an invoice id from the URL would be enough to read somebody
    else's billing.
    """

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        account = getattr(self.request.user, "client_account", None)
        if account is None:
            return Invoice.objects.none()
        return Invoice.objects.filter(account=account)


class InvoiceListView(_ClientScopedMixin, generics.ListAPIView):
    serializer_class = InvoiceSerializer


class InvoicePayView(_ClientScopedMixin, APIView):
    """Starts a payment for one invoice and returns where to send the browser."""

    def post(self, request, pk: int):
        invoice = self.get_queryset().filter(pk=pk).first()
        if invoice is None:
            return Response({"detail": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND)

        if not invoice.is_payable:
            return Response(
                {"detail": f"This invoice is {invoice.get_status_display().lower()}."},
                status=status.HTTP_409_CONFLICT,
            )

        if not paystack.is_configured():
            return Response(
                {
                    "detail": (
                        "Card payments are not switched on yet. We will email you an "
                        "invoice with payment details in the meantime."
                    ),
                    "configured": False,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Recorded before the customer leaves, so an abandoned attempt is still
        # visible afterwards. `reference` is generated here, never supplied by
        # the client, and is unique.
        payment = Payment.objects.create(
            invoice=invoice,
            provider="paystack",
            amount=invoice.amount,
            currency=invoice.currency,
        )

        callback = f"{settings.PORTAL_URL}/account?payment={payment.reference}"
        try:
            body = paystack.initialize(payment, callback)
        except Exception:  # noqa: BLE001 - the gateway's failure is not the client's problem
            logger.exception("Paystack initialize failed for %s", invoice.number)
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status", "updated_at"])
            return Response(
                {"detail": "We could not reach the payment provider. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        data = body.get("data") or {}
        url = data.get("authorization_url")
        if not body.get("status") or not url:
            payment.status = Payment.Status.FAILED
            payment.provider_payload = body
            payment.save(update_fields=["status", "provider_payload", "updated_at"])
            return Response(
                {"detail": "The payment provider refused the request."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payment.provider_reference = data.get("access_code", "")
        payment.provider_payload = body
        payment.save(update_fields=["provider_reference", "provider_payload", "updated_at"])

        return Response({"configured": True, "ok": True, "authorization_url": url})


def settle(reference: str) -> bool:
    """Ask Paystack about one payment and settle the invoice if it succeeded.

    The single place an invoice becomes paid. Idempotent, and it refuses to
    settle unless the amount and currency Paystack reports match what we
    recorded when the payment started.
    """
    payment = Payment.objects.filter(reference=reference).select_related("invoice").first()
    if payment is None:
        return False

    if payment.status == Payment.Status.SUCCEEDED:
        return True

    try:
        body = paystack.verify(reference)
    except Exception:  # noqa: BLE001
        logger.exception("Paystack verify failed for %s", reference)
        return False

    data = body.get("data") or {}
    payment.provider_payload = data

    paid = (
        bool(body.get("status"))
        and data.get("status") == "success"
        and data.get("amount") == paystack.to_subunit(payment.amount)
        and (data.get("currency") or "").upper() == payment.currency.upper()
    )

    if not paid:
        payment.status = Payment.Status.FAILED
        payment.save(update_fields=["status", "provider_payload", "updated_at"])
        logger.warning("Payment %s did not verify as paid: %s", reference, data.get("status"))
        return False

    with transaction.atomic():
        payment.status = Payment.Status.SUCCEEDED
        payment.save(update_fields=["status", "provider_payload", "updated_at"])
        invoice = payment.invoice
        if invoice.status != Invoice.Status.PAID:
            invoice.status = Invoice.Status.PAID
            invoice.paid_at = timezone.now()
            invoice.save(update_fields=["status", "paid_at", "updated_at"])

    return True


class PaystackWebhookView(APIView):
    """Paystack's server-to-server notification.

    The signature is checked first, then the result is confirmed by calling
    Paystack back. Nothing in the request body is believed on its own.
    """

    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request):
        if not paystack.is_configured():
            # Never verify with an empty key: HMAC with a blank secret is
            # computable by anyone, so this would fail open.
            return HttpResponse(status=503)

        signature = request.headers.get("x-paystack-signature", "")
        if not paystack.verify_signature(request.body, signature):
            logger.warning("Rejected a Paystack webhook with a bad signature")
            return HttpResponse(status=401)

        payload = request.data if isinstance(request.data, dict) else {}
        reference = (payload.get("data") or {}).get("reference", "")
        if not reference:
            return HttpResponse("OK")

        settle(reference)
        return HttpResponse("OK")


class PaystackReturnView(APIView):
    """Where the customer's browser lands after paying.

    Confirms with Paystack as well, so the portal is up to date even if the
    webhook is slow. The browser cannot influence the outcome: all it supplies
    is a reference, and the answer comes from Paystack.
    """

    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request):
        reference = request.query_params.get("reference", "")
        if reference and paystack.is_configured():
            settle(reference)
        return redirect(f"{settings.PORTAL_URL}/account")
