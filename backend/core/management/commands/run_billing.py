"""The monthly billing job, in one command.

Raises next month's invoice for every active client, charges the ones who
have a saved card, then flags anything that has gone past its due date. Safe
to run daily: it never bills a period twice and never raises an invoice for
nothing.

    python manage.py run_billing --dry-run
    python manage.py run_billing
"""

from django.core.management.base import BaseCommand

from core.invoicing import mark_overdue, raise_domain_renewal, raise_next_invoice
from core.models import ClientAccount, Invoice, Payment
from core import payfast


class Command(BaseCommand):
    help = "Raise invoices for the month ahead and mark overdue ones."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Say what would happen without writing anything.",
        )
        parser.add_argument(
            "--no-charge",
            action="store_true",
            help="Raise invoices but do not charge any saved cards.",
        )
        parser.add_argument(
            "--days-ahead",
            type=int,
            default=7,
            help="Only bill clients whose next payment falls within this many days.",
        )

    def handle(self, *args, **options):
        from datetime import date, timedelta

        horizon = date.today() + timedelta(days=options["days_ahead"])
        due = ClientAccount.objects.filter(
            status=ClientAccount.Status.ACTIVE
        ).exclude(next_payment_date__gt=horizon)

        raised = 0
        for account in due:
            if options["dry_run"]:
                self.stdout.write(
                    f"would bill {account.company_name}: "
                    f"{account.currency} {account.monthly_total} "
                    f"for {account.next_payment_date}"
                )
                continue
            invoice = raise_next_invoice(account)
            if invoice is None:
                continue
            raised += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"{invoice.number}  {account.company_name}  "
                    f"{invoice.currency} {invoice.amount}  due {invoice.due_on}"
                )
            )

        # Domains renew once a year. Nothing else would remember, which is how
        # a renewal quietly becomes a cost you absorb forever.
        renewals = 0
        due_domains = ClientAccount.objects.filter(
            status=ClientAccount.Status.ACTIVE,
            domain_renews_on__lte=horizon,
        ).exclude(domain="")
        for account in due_domains:
            if options["dry_run"]:
                self.stdout.write(
                    f"would renew {account.domain} for {account.company_name} "
                    f"on {account.domain_renews_on}"
                )
                continue
            invoice = raise_domain_renewal(account)
            if invoice is None:
                continue
            renewals += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"{invoice.number}  {account.company_name}  "
                    f"{invoice.currency} {invoice.amount}  domain  due {invoice.due_on}"
                )
            )

        if options["dry_run"]:
            self.stdout.write("Dry run, nothing was written.")
            return

        charged, declined = 0, 0
        if not options["no_charge"]:
            charged, declined = self.charge_saved_cards()

        overdue = mark_overdue()
        self.stdout.write(
            f"Raised {raised} monthly invoice{'s' if raised != 1 else ''} and "
            f"{renewals} domain renewal{'s' if renewals != 1 else ''}, "
            f"charged {charged}, {declined} declined, marked {overdue} overdue."
        )

    def charge_saved_cards(self) -> tuple[int, int]:
        """Charge every unpaid invoice belonging to a client who saved a card.

        A decline is an ordinary event: an expired card, or no money in the
        account. It is written down as a failed payment and the invoice stays
        unpaid, so the client still sees what they owe and nobody is told a
        payment went through that did not.
        """
        if not payfast.is_configured():
            self.stdout.write("Payfast is not configured, so no cards were charged.")
            return 0, 0

        charged, declined = 0, 0
        unpaid = (
            Invoice.objects.filter(
                status__in=[Invoice.Status.DUE, Invoice.Status.OVERDUE],
                account__autopay=True,
                account__status=ClientAccount.Status.ACTIVE,
            )
            .exclude(account__payfast_token="")
            .select_related("account")
            .order_by("issued_on", "id")
        )

        for invoice in unpaid:
            account = invoice.account
            # A row first, so a charge that succeeds while the response is
            # lost still has somewhere to be reconciled to.
            payment = Payment.objects.create(
                invoice=invoice,
                provider="payfast",
                amount=invoice.amount,
                currency=invoice.currency,
            )
            result = payfast.charge(
                token=account.payfast_token,
                amount=invoice.amount,
                item_name=invoice.number,
                payment_id=payment.reference,
                item_description=invoice.period_label,
            )
            payment.provider_payload = {"message": result.message}
            payment.provider_reference = result.payfast_payment_id

            if result.ok:
                # Payfast also sends an ITN for this charge, and that is what
                # marks the invoice paid. Doing it here as well would mean two
                # code paths deciding the same thing; this one only records
                # that the charge was accepted.
                payment.status = Payment.Status.SUCCEEDED
                charged += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"charged {invoice.number}  {account.company_name}  "
                        f"{invoice.currency} {invoice.amount}"
                    )
                )
            else:
                payment.status = Payment.Status.FAILED
                declined += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"declined {invoice.number}  {account.company_name}  "
                        f"{result.message}"
                    )
                )
            payment.save()

        return charged, declined
