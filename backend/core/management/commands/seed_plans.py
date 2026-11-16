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
    {
        "slug": "dashboard-and-reporting",
        "name": "Dashboard & Reporting",
        "tagline": "Your business numbers on one screen, kept up to date.",
        "description": (
            "We build a Power BI report from the data you already have, then host "
            "it and refresh it every month so the numbers are never stale."
        ),
        "setup_fee": Decimal("300.00"),
        "monthly_fee": Decimal("120.00"),
        "currency": "ZAR",
        "features": [
            "A report built around the questions you actually ask",
            "Hosted and refreshed every month",
            "Works from a spreadsheet, a till system or your website",
            "Opens on a phone as well as a laptop",
            "Changes to the report included",
        ],
        "is_featured": False,
        "sort_order": 1,
    },
    {
        "slug": "mobile-app-build-and-hosting",
        "name": "Mobile App Build & Hosting",
        "tagline": "An app built to your specification, published and looked after.",
        "description": (
            "We build your app from a written specification, put it on the "
            "Google Play Store and keep it running. Google's developer fee and "
            "any paid services the app uses are billed to you directly."
        ),
        "setup_fee": Decimal("1500.00"),
        "monthly_fee": Decimal("500.00"),
        "currency": "ZAR",
        "features": [
            "Built to a written specification you sign off",
            "Android and iPhone from one build",
            "Hosting, monitoring and updates every month",
            "Publishing to the Google Play Store quoted on top",
            "API keys and paid services are billed to you directly",
        ],
        "is_featured": False,
        "sort_order": 2,
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
    {
        "slug": "priority-support",
        "name": "Priority support",
        "description": (
            "Same-day answers on working days and first place in the queue for "
            "changes, instead of the usual two."
        ),
        "monthly_fee": Decimal("100.00"),
        "setup_fee": Decimal("0.00"),
        "currency": "ZAR",
        "sort_order": 2,
    },
    {
        "slug": "data-analysis",
        "name": "Data analysis, once off",
        "description": (
            "A written answer to a question about your numbers: what sells, when, "
            "to whom, and what it costs you. Charged once, not monthly."
        ),
        # Nothing monthly: this is a piece of work, not a subscription, and a
        # zero means the card shows the once-off fee alone.
        "monthly_fee": Decimal("0.00"),
        "setup_fee": Decimal("950.00"),
        "currency": "ZAR",
        "sort_order": 3,
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
