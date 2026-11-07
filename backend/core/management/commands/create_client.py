"""Create a client login and their portal account in one step.

Run it on the server that owns the real database. On Render that is the Shell
tab of the orbit-backend service, not your laptop: the two have separate
databases, so an account made locally does not exist in production.
"""

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from core.models import AddOn, ClientAccount, Invoice, Plan
from core.passwords import generate_password

User = get_user_model()


class Command(BaseCommand):
    help = "Create a client login and portal account, printing the credentials once."

    def add_arguments(self, parser):
        parser.add_argument("--name", required=True, help="The person's full name.")
        parser.add_argument("--email", required=True, help="Their email, used to sign in.")
        parser.add_argument("--company", help="Business name. Defaults to their name.")
        parser.add_argument("--website", default="", help="The live site we host for them.")
        parser.add_argument(
            "--plan",
            default="website-build-and-hosting",
            help="Plan slug. Pass an empty string for no plan.",
        )
        parser.add_argument(
            "--addon",
            action="append",
            default=[],
            dest="addons",
            help="Add-on slug. Repeat the flag for more than one.",
        )
        parser.add_argument("--password", help="Set one explicitly instead of generating it.")
        parser.add_argument(
            "--monthly",
            help="Charge a fixed monthly amount instead of plan plus add-ons.",
        )
        parser.add_argument(
            "--first-invoice",
            action="store_true",
            help="Also raise the first invoice, due in 7 days.",
        )
        parser.add_argument(
            "--setup-fee",
            action="store_true",
            help="Include the plan's once-off setup fee on that first invoice.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        name = options["name"].strip()
        company = (options.get("company") or name).strip()

        if User.objects.filter(email__iexact=email).exists():
            raise CommandError(f"A user with the email {email} already exists.")

        username = email
        if User.objects.filter(username=username).exists():
            raise CommandError(f"A user with the username {username} already exists.")

        password = options.get("password") or generate_password()

        parts = name.split()
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=parts[0] if parts else "",
            last_name=" ".join(parts[1:]) if len(parts) > 1 else "",
        )

        plan = None
        if options["plan"]:
            plan = Plan.objects.filter(slug=options["plan"]).first()
            if plan is None:
                raise CommandError(
                    f"No plan with slug {options['plan']!r}. Run seed_plans first."
                )

        account = ClientAccount.objects.create(
            user=user,
            company_name=company,
            website_url=options["website"],
            plan=plan,
            monthly_fee_override=(
                Decimal(options["monthly"]) if options.get("monthly") else None
            ),
            next_payment_date=date.today() + timedelta(days=30),
        )

        for slug in options["addons"]:
            addon = AddOn.objects.filter(slug=slug).first()
            if addon is None:
                raise CommandError(f"No add-on with slug {slug!r}.")
            account.addons.add(addon)

        invoice = None
        if options["first_invoice"]:
            amount = account.monthly_total
            description = "First month"
            if options["setup_fee"] and plan:
                amount += plan.setup_fee
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

        w = self.stdout.write
        w("")
        w(self.style.SUCCESS("Client account created."))
        w("")
        w("  Name       : " + name)
        w("  Company    : " + company)
        w("  Sign in at : /login")
        w("  Email      : " + email)
        w("  Password   : " + password)
        w("")
        w("  Plan       : " + (plan.name if plan else "none"))
        w(f"  Monthly    : {account.currency} {account.monthly_total}")
        w("  Next due   : " + str(account.next_payment_date))
        if invoice:
            w(f"  Invoice    : {invoice.number} for {invoice.currency} {invoice.amount}")
        w("")
        w(
            self.style.WARNING(
                "This password is shown once and is not recoverable. Send it to the "
                "client over something other than email if you can, and ask them to "
                "change it after signing in."
            )
        )
