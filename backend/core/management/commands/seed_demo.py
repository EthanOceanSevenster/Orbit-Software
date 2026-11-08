"""Fill the dashboard with example clients so it can be looked at.

Every record this creates is tagged, and ``--remove`` deletes exactly those and
nothing else. That is the point: demo data you cannot confidently remove ends
up living in the real database forever.

Never run this against production. It refuses when DEBUG is off.
"""

from datetime import date, timedelta
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from core.models import AddOn, ClientAccount, Invoice, Plan, ServiceRequest
from core.passwords import generate_password

User = get_user_model()

# Every demo login uses this domain, which is how --remove finds them again.
DOMAIN = "demo.orbit.invalid"

CLIENTS = [
    {
        "name": "Nomsa Dlamini",
        "company": "Dlamini Attorneys",
        "website": "https://dlaminiattorneys.co.za",
        "status": ClientAccount.Status.ACTIVE,
        "addon": True,
        "invoice": ("paid", Decimal("170.00"), -20),
        "request": None,
    },
    {
        "name": "Sipho Khumalo",
        "company": "Khumalo Plumbing",
        "website": "https://khumaloplumbing.co.za",
        "status": ClientAccount.Status.ACTIVE,
        "addon": False,
        "invoice": ("overdue", Decimal("120.00"), -12),
        "request": ("dashboard", "Want to see jobs booked per month on one screen."),
    },
    {
        "name": "Lerato Mabaso",
        "company": "Mabaso Catering",
        "website": "",
        "status": ClientAccount.Status.PENDING,
        "addon": False,
        "invoice": None,
        "request": ("website", "Need a site with our menu and a booking form."),
    },
    {
        "name": "Johan van Wyk",
        "company": "Van Wyk Motors",
        "website": "https://vanwykmotors.co.za",
        "status": ClientAccount.Status.PAUSED,
        "addon": False,
        "invoice": None,
        "request": None,
    },
]


class Command(BaseCommand):
    help = "Create (or remove) example clients so the dashboard has something in it."

    def add_arguments(self, parser):
        parser.add_argument(
            "--remove", action="store_true", help="Delete the demo data instead."
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError(
                "Refusing to run with DEBUG off. This command is for a development "
                "database only."
            )

        if options["remove"]:
            deleted, _ = User.objects.filter(email__endswith=f"@{DOMAIN}").delete()
            self.stdout.write(self.style.SUCCESS(f"Removed {deleted} demo records."))
            return

        plan = Plan.objects.filter(slug="website-build-and-hosting").first()
        if plan is None:
            raise CommandError("No plans found. Run seed_plans first.")
        addon = AddOn.objects.filter(slug="business-email").first()

        today = date.today()
        created = 0

        for index, spec in enumerate(CLIENTS, start=1):
            email = f"{spec['name'].split()[0].lower()}@{DOMAIN}"
            if User.objects.filter(username=email).exists():
                continue

            parts = spec["name"].split()
            user = User.objects.create_user(
                username=email,
                email=email,
                # Random and discarded. These are for looking at, not
                # signing in as.
                password=generate_password(),
                first_name=parts[0],
                last_name=" ".join(parts[1:]),
            )
            account = ClientAccount.objects.create(
                user=user,
                company_name=spec["company"],
                website_url=spec["website"],
                plan=plan if spec["status"] != ClientAccount.Status.PENDING else None,
                status=spec["status"],
                next_payment_date=(
                    today + timedelta(days=7 * index)
                    if spec["status"] == ClientAccount.Status.ACTIVE
                    else None
                ),
            )
            if spec["addon"] and addon:
                account.addons.add(addon)

            if spec["invoice"]:
                status, amount, offset = spec["invoice"]
                Invoice.objects.create(
                    account=account,
                    number=f"INV-DEMO-{index:04d}",
                    description="Monthly hosting",
                    amount=amount,
                    currency="ZAR",
                    issued_on=today + timedelta(days=offset),
                    due_on=today + timedelta(days=offset + 7),
                    status=status,
                )

            if spec["request"]:
                service, details = spec["request"]
                ServiceRequest.objects.create(
                    account=account, service=service, details=details
                )

            created += 1

        self.stdout.write(self.style.SUCCESS(f"Created {created} demo clients."))
        self.stdout.write("Remove them again with: manage.py seed_demo --remove")
