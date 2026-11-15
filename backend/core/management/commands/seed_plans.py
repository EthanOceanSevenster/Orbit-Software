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
        # Creating the mailbox and changing the domain's mail records is work
        # that happens once.
        "setup_fee": Decimal("50.00"),
        "currency": "ZAR",
        "sort_order": 0,
    },
    {
        "slug": "email-marketing",
        "name": "Email marketing",
        "description": (
            "We write and send marketing emails to your customer list, and tell "
            "you afterwards how many opened them."
        ),
        "monthly_fee": Decimal("80.00"),
        # Building the list, verifying a sending domain and designing the
        # template is most of the work, and it is done once.
        "setup_fee": Decimal("400.00"),
        "currency": "ZAR",
        "sort_order": 1,
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
