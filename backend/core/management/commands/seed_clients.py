"""Create the real client accounts at deploy time.

Render's free plan has no shell, so there is nowhere to run create_client by
hand on the server that owns the real database. This runs on every deploy
instead, reads the list of clients that ships with the code and creates any
that are missing. Adding a client is therefore a commit, which means it is
reviewed, dated and revertable like anything else.

The list is `backend/seed_clients.json`. SEED_CLIENTS in the environment
overrides it, for anything that should not be in the repository.

It never touches a client that already exists. Not their plan, not their
fees, not their password. A deploy must be safe to run fifty times, and the
one thing worse than a missing client is a deploy that quietly resets a
paying customer's password or puts them back on last month's price.

The file, and SEED_CLIENTS, are both JSON: a list of objects:

    [
      {
        "name": "Phakama Ndamase",
        "email": "phakama@example.com",
        "company": "Mimshack Wellness",
        "website": "https://www.mimschakwellness.com/",
        "plan": "website-build-and-hosting",
        "addons": ["business-email", "email-marketing"],
        "next_payment_date": "2026-11-30",
        "password": "optional, generated when left out"
      }
    ]

Anything it generates is printed once, into the deploy log, which is the only
place it can be read afterwards.
"""

import json
import os
from datetime import date, timedelta
from pathlib import Path
from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import AddOn, ClientAccount, Plan
from core.passwords import generate_password

User = get_user_model()


class Command(BaseCommand):
    help = "Create any client accounts listed in SEED_CLIENTS that do not exist yet."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            help="Read the list from this JSON file instead of the default one.",
        )

    def handle(self, *args, **options):
        # Order of preference: an explicit file, then the environment, then
        # the list that ships with the code. The environment wins over the
        # file so a client who should not be in the repository can still be
        # seeded.
        raw, source = "", ""
        if options.get("file"):
            raw = Path(options["file"]).read_text(encoding="utf-8")
            source = options["file"]
        elif (os.getenv("SEED_CLIENTS") or "").strip():
            raw = os.environ["SEED_CLIENTS"].strip()
            source = "SEED_CLIENTS"
        else:
            default = Path(__file__).resolve().parents[3] / "seed_clients.json"
            if default.exists():
                raw = default.read_text(encoding="utf-8")
                source = default.name

        if not raw:
            self.stdout.write("No client list found, so no clients were seeded.")
            return

        self.stdout.write(f"Seeding clients from {source}.")

        try:
            entries = json.loads(raw)
        except json.JSONDecodeError as error:
            # Deliberately not an error: a typo in an environment variable
            # should not take the site down on the next deploy.
            self.stderr.write(f"SEED_CLIENTS is not valid JSON ({error}). Skipping.")
            return

        if not isinstance(entries, list):
            self.stderr.write("SEED_CLIENTS must be a list of objects. Skipping.")
            return

        created, skipped = 0, 0
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            result = self.seed_one(entry)
            if result:
                created += 1
            else:
                skipped += 1

        self.stdout.write(
            f"Seeded {created} client{'s' if created != 1 else ''}, "
            f"left {skipped} alone."
        )

    @transaction.atomic
    def seed_one(self, entry: dict) -> bool:
        email = str(entry.get("email", "")).strip().lower()
        name = str(entry.get("name", "")).strip()
        if not email or not name:
            self.stderr.write("A client needs both a name and an email. Skipping one.")
            return False

        if User.objects.filter(email__iexact=email).exists():
            self.stdout.write(f"{email} already exists, left alone.")
            return False

        plan = None
        plan_slug = str(entry.get("plan", "")).strip()
        if plan_slug:
            plan = Plan.objects.filter(slug=plan_slug).first()
            if plan is None:
                self.stderr.write(f"No plan {plan_slug!r} for {email}. Skipping.")
                return False

        monthly = None
        if entry.get("monthly"):
            try:
                monthly = Decimal(str(entry["monthly"]))
            except (InvalidOperation, ValueError):
                self.stderr.write(f"Monthly amount for {email} is not a number. Skipping.")
                return False

        try:
            next_payment = (
                date.fromisoformat(str(entry["next_payment_date"]))
                if entry.get("next_payment_date")
                else date.today() + timedelta(days=30)
            )
        except ValueError:
            self.stderr.write(f"Next payment date for {email} is not a date. Skipping.")
            return False

        password = str(entry.get("password", "")).strip() or generate_password()
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
            company_name=str(entry.get("company", "")).strip() or name,
            contact_name=name,
            billing_email=email,
            phone=str(entry.get("phone", "")).strip(),
            website_url=str(entry.get("website", "")).strip(),
            domain=str(entry.get("domain", "")).strip(),
            plan=plan,
            monthly_fee_override=monthly,
            next_payment_date=next_payment,
            status=ClientAccount.Status.ACTIVE,
        )

        slugs = [str(slug) for slug in (entry.get("addons") or [])]
        if slugs:
            found = AddOn.objects.filter(slug__in=slugs)
            missing = set(slugs) - {addon.slug for addon in found}
            if missing:
                self.stderr.write(f"Unknown add-ons for {email}: {', '.join(sorted(missing))}")
            account.addons.set(found)

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {account.company_name}: {email} / {password} "
                f"({account.currency} {account.monthly_total} a month, "
                f"next {account.next_payment_date})"
            )
        )
        return True
