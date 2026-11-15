"""Catch payments that succeeded but never got confirmed.

An invoice is marked paid in one of two ways: the customer returns to the site
after paying, or Paystack's webhook tells us. Both can be missed. A customer
closes the tab on the bank's page, their phone drops the connection, or the
webhook cannot reach us because the site has no public certificate yet.

The money has still left their account. This asks Paystack about every payment
we started and never saw an answer for, and settles the ones that succeeded.

Safe to run as often as you like: it only reads from Paystack and only moves an
invoice to paid when Paystack says the amount and currency match.

    python manage.py reconcile_payments
    python manage.py reconcile_payments --minutes 0 --verbose
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from core import paystack
from core.billing_views import settle
from core.models import Payment


class Command(BaseCommand):
    help = "Ask Paystack about unfinished payments and settle the ones that went through."

    def add_arguments(self, parser):
        parser.add_argument(
            "--minutes",
            type=int,
            default=10,
            help=(
                "Only look at payments started at least this many minutes ago, so a "
                "customer still on the payment page is left alone. Default 10."
            ),
        )
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="How far back to look. Default 7 days.",
        )
        parser.add_argument(
            "--verbose", action="store_true", help="Print every payment checked."
        )

    def handle(self, *args, **options):
        if not paystack.is_configured():
            self.stdout.write(
                self.style.WARNING(
                    "PAYSTACK_SECRET_KEY is not set, so there is nothing to ask. "
                    "Nothing was changed."
                )
            )
            return

        now = timezone.now()
        pending = Payment.objects.filter(
            status=Payment.Status.STARTED,
            created_at__lte=now - timedelta(minutes=options["minutes"]),
            created_at__gte=now - timedelta(days=options["days"]),
        ).select_related("invoice", "invoice__account")

        checked = settled = 0
        for payment in pending:
            checked += 1
            if settle(payment.reference):
                settled += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Settled {payment.invoice.number} for "
                        f"{payment.invoice.account.company_name}: "
                        f"{payment.currency} {payment.amount}"
                    )
                )
            elif options["verbose"]:
                self.stdout.write(f"  still unpaid: {payment.reference}")

        if checked == 0:
            self.stdout.write("Nothing waiting to be confirmed.")
        else:
            self.stdout.write(
                f"Checked {checked} unfinished payment{'s' if checked != 1 else ''}, "
                f"settled {settled}."
            )
