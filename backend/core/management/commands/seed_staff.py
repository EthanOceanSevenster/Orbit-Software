"""Create the owner logins at deploy time, from a list that ships with the code.

Render's free plan has no shell and nobody wants to set environment variables
by hand to get into their own console. This runs on every deploy, reads
`backend/seed_staff.json` and creates any account in it that does not exist
yet. Adding an owner login is therefore a commit, like everything else.

It never touches an account that is already there, so a deploy cannot reset
your own password while you are using it.

Passwords are generated and printed once, into the deploy log. They are
deliberately not read from the file: this repository is public, and an
admin password in it would hand the console to anybody who can read GitHub.
Set one in the file only if the repository is private.

    [{"name": "Ethan", "email": "admin@example.com"}]
"""

import json
import os
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from core.passwords import generate_password

User = get_user_model()


class Command(BaseCommand):
    help = "Create any owner logins listed in seed_staff.json that do not exist yet."

    def add_arguments(self, parser):
        parser.add_argument("--file", help="Read the list from this JSON file instead.")

    def handle(self, *args, **options):
        raw, source = "", ""
        if options.get("file"):
            raw = Path(options["file"]).read_text(encoding="utf-8")
            source = options["file"]
        elif (os.getenv("SEED_STAFF") or "").strip():
            raw = os.environ["SEED_STAFF"].strip()
            source = "SEED_STAFF"
        else:
            default = Path(__file__).resolve().parents[3] / "seed_staff.json"
            if default.exists():
                raw = default.read_text(encoding="utf-8")
                source = default.name

        if not raw:
            self.stdout.write("No owner list found, so no logins were seeded.")
            return

        try:
            entries = json.loads(raw)
        except json.JSONDecodeError as error:
            # Never fail a deploy over a typo in a list.
            self.stderr.write(f"{source} is not valid JSON ({error}). Skipping.")
            return

        if not isinstance(entries, list):
            self.stderr.write(f"{source} must be a list of objects. Skipping.")
            return

        self.stdout.write(f"Seeding owner logins from {source}.")
        created = 0

        for entry in entries:
            if not isinstance(entry, dict):
                continue
            email = str(entry.get("email", "")).strip().lower()
            if not email:
                self.stderr.write("An owner login needs an email. Skipping one.")
                continue

            if User.objects.filter(email__iexact=email).exists():
                self.stdout.write(f"{email} already exists, left alone.")
                continue

            name = str(entry.get("name", "")).strip()
            parts = name.split()
            password = str(entry.get("password", "")).strip() or generate_password()

            User.objects.create_superuser(
                username=email,
                email=email,
                password=password,
                first_name=parts[0] if parts else "",
                last_name=" ".join(parts[1:]) if len(parts) > 1 else "",
            )
            created += 1
            self.stdout.write(
                self.style.SUCCESS(f"Created owner login {email} / {password}")
            )

        self.stdout.write(f"Seeded {created} owner login{'s' if created != 1 else ''}.")
