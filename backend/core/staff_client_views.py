"""
Creating a client from the console, instead of from a shell.

The same work `manage.py create_client` does, behind a staff-only endpoint,
because Render's free plan has no shell and the Django admin is a worse place
to do it: the admin would happily let you make an account with no login, or a
login with no account, and neither is any use to a client.

The generated password is returned exactly once, in the response that creates
the account. It is hashed on the way into the database and cannot be read
back afterwards, so it is shown once or not at all.
"""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AddOn, ClientAccount, Invoice, Plan
from .passwords import generate_password

User = get_user_model()


class StaffClientCreateView(APIView):
    """Create a login and a portal account together, or neither."""

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request):
        data = request.data if isinstance(request.data, dict) else {}

        name = str(data.get("name", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        if not name or not email:
            return Response(
                {"detail": "A name and an email address are both needed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {"detail": f"{email} already has a login."},
                status=status.HTTP_409_CONFLICT,
            )

        plan = None
        plan_slug = str(data.get("plan", "")).strip()
        if plan_slug:
            plan = Plan.objects.filter(slug=plan_slug).first()
            if plan is None:
                return Response(
                    {"detail": f"No plan called {plan_slug}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        addons = list(AddOn.objects.filter(slug__in=data.get("addons") or []))

        monthly_override = None
        raw_monthly = str(data.get("monthly", "")).strip()
        if raw_monthly:
            try:
                monthly_override = Decimal(raw_monthly)
            except (InvalidOperation, ValueError):
                return Response(
                    {"detail": "The monthly amount is not a number."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # A date the owner typed beats the default, which is simply a month
        # from today and is right more often than it is wrong.
        next_payment = str(data.get("next_payment_date", "")).strip()
        try:
            due_date = (
                date.fromisoformat(next_payment)
                if next_payment
                else date.today() + timedelta(days=30)
            )
        except ValueError:
            return Response(
                {"detail": "The next payment date is not a date."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        password = str(data.get("password", "")).strip() or generate_password()
        parts = name.split()

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=parts[0] if parts else "",
            last_name=" ".join(parts[1:]) if len(parts) > 1 else "",
        )

        account = ClientAccount.objects.create(
            user=user,
            company_name=str(data.get("company", "")).strip() or name,
            contact_name=name,
            billing_email=email,
            phone=str(data.get("phone", "")).strip(),
            website_url=str(data.get("website", "")).strip(),
            domain=str(data.get("domain", "")).strip(),
            plan=plan,
            monthly_fee_override=monthly_override,
            next_payment_date=due_date,
            status=ClientAccount.Status.ACTIVE,
        )
        if addons:
            account.addons.set(addons)

        invoice = None
        if data.get("first_invoice"):
            amount = account.monthly_total
            description = "First month"
            if data.get("setup_fee") and plan:
                amount += plan.setup_fee
                for addon in account.addons.all():
                    amount += addon.setup_fee
                description = "Website build and first month"
            invoice = Invoice.objects.create(
                account=account,
                number=f"INV-{date.today():%Y%m}-{account.pk:04d}",
                description=description,
                amount=amount,
                currency=account.currency,
                issued_on=date.today(),
                due_on=date.today() + timedelta(days=7),
                status=Invoice.Status.DUE,
            )

        return Response(
            {
                "id": account.pk,
                "company_name": account.company_name,
                "contact": account.contact,
                "email": email,
                # Shown once. There is no way to read it back.
                "password": password,
                "monthly_total": str(account.monthly_total),
                "currency": account.currency,
                "next_payment_date": account.next_payment_date,
                "website_url": account.website_url,
                "plan_name": plan.name if plan else "",
                "addons": [addon.name for addon in account.addons.all()],
                "invoice": (
                    {"number": invoice.number, "amount": str(invoice.amount)}
                    if invoice
                    else None
                ),
            },
            status=status.HTTP_201_CREATED,
        )
