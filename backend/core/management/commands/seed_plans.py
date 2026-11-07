from decimal import Decimal

from django.core.management.base import BaseCommand

from core.models import AddOn, Plan

DEFAULT_PLANS = [
    {
        "slug": "website-build-and-hosting",
        "name": "Website Build & Hosting",
        "tagline": "A professionally built website, hosted and maintained for you.",
        "description": (
            "We design and build your website, then host, secure and keep it "
            "updated for one flat monthly fee."
        ),
        "setup_fee": Decimal("500.00"),
        "monthly_fee": Decimal("120.00"),
        "currency": "ZAR",
        "features": [
            "Custom design and build",
            "Managed hosting and SSL certificate",
            "Mobile-friendly and fast by default",
            "Security updates and backups",
            "Content updates and ongoing support",
            "Domain setup assistance",
        ],
        "is_featured": True,
        "sort_order": 0,
    },
]

DEFAULT_ADDONS = [
    {
        "slug": "business-email",
        "name": "Business email address",
        "description": (
            "An email address on your own domain, such as hello@yourbusiness.co.za, "
            "set up and managed for you."
        ),
        "monthly_fee": Decimal("50.00"),
        "currency": "ZAR",
        "sort_order": 0,
    },
]


class Command(BaseCommand):
    help = "Create or update the default pricing plan and add-ons."

    def handle(self, *args, **options):
        for data in DEFAULT_PLANS:
            plan, created = Plan.objects.update_or_create(slug=data["slug"], defaults=data)
            self.stdout.write(
                self.style.SUCCESS(f"{'Created' if created else 'Updated'} plan: {plan.name}")
            )

        for data in DEFAULT_ADDONS:
            addon, created = AddOn.objects.update_or_create(slug=data["slug"], defaults=data)
            self.stdout.write(
                self.style.SUCCESS(f"{'Created' if created else 'Updated'} add-on: {addon.name}")
            )
