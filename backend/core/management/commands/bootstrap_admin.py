"""Create the admin login at deploy time.

Render's free plan has no shell, so there is no way to run createsuperuser by
hand. This runs on every deploy instead and is a no-op once the account exists,
so it is safe to leave in the build script forever.

It reads DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD. If either is
missing it does nothing and says so, rather than failing the deploy.
"""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Create the superuser from env vars if it does not exist yet."

    def handle(self, *args, **options):
        email = (os.getenv("DJANGO_SUPERUSER_EMAIL") or "").strip().lower()
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD") or ""

        if not email or not password:
            self.stdout.write(
                "No DJANGO_SUPERUSER_EMAIL or DJANGO_SUPERUSER_PASSWORD set, "
                "skipping admin creation."
            )
            return

        existing = User.objects.filter(email__iexact=email).first()
        if existing is not None:
            # Deliberately does not reset the password. A deploy should never
            # silently change a credential that is already in use.
            if not existing.is_superuser:
                existing.is_superuser = True
                existing.is_staff = True
                existing.save(update_fields=["is_superuser", "is_staff"])
                self.stdout.write(self.style.SUCCESS(f"Promoted {email} to admin."))
            else:
                self.stdout.write(f"Admin {email} already exists, leaving it alone.")
            return

        User.objects.create_superuser(username=email, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Created admin {email}."))
        self.stdout.write(
            self.style.WARNING(
                "Remove DJANGO_SUPERUSER_PASSWORD from the environment once you "
                "have signed in, so the password is not left sitting in config."
            )
        )
