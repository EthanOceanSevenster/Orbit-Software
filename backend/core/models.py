import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models


def new_payment_reference() -> str:
    """A unique, URL-safe reference we hand to the payment provider.

    Returns a string rather than a UUID object: this value is JSON-encoded into
    the request to the provider, and a UUID would not serialise.
    """
    return uuid.uuid4().hex


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Plan(TimeStampedModel):
    """A product the company sells, e.g. the Website Build & Hosting plan."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    tagline = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    setup_fee = models.DecimalField(max_digits=10, decimal_places=2)
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="ZAR")
    features = models.JSONField(default=list, blank=True, help_text="List of feature strings.")
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return self.name


class AddOn(TimeStampedModel):
    """An optional monthly extra on top of a plan, e.g. a business email address."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="ZAR")
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return self.name


class ContactInquiry(TimeStampedModel):
    """A message sent through the contact form."""

    name = models.CharField(max_length=120)
    email = models.EmailField()
    company = models.CharField(max_length=120, blank=True)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "contact inquiries"

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"


class ProjectRequest(TimeStampedModel):
    """A get-started submission: someone wants a website built and hosted."""

    class Status(models.TextChoices):
        NEW = "new", "New"
        CONTACTED = "contacted", "Contacted"
        IN_PROGRESS = "in_progress", "In progress"
        LIVE = "live", "Live"
        CLOSED = "closed", "Closed"

    class WebsiteType(models.TextChoices):
        BUSINESS = "business", "Business / brochure site"
        ECOMMERCE = "ecommerce", "Online store"
        PORTFOLIO = "portfolio", "Portfolio"
        LANDING = "landing", "Landing page"
        OTHER = "other", "Something else"

    name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)
    company = models.CharField(max_length=120, blank=True)
    plan = models.ForeignKey(
        Plan,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="project_requests",
    )
    website_type = models.CharField(
        max_length=20, choices=WebsiteType.choices, default=WebsiteType.BUSINESS
    )
    # No longer collected by the public form. Kept so historic rows stay intact
    # and so staff can note an existing site in the admin.
    existing_site_url = models.URLField(blank=True)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    internal_notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_website_type_display()})"


class ClientAccount(TimeStampedModel):
    """A paying customer's view of their own account.

    One of these per login. It is what the client portal reads: what they pay
    next, where their site lives, and what they are getting for the money.
    """

    class Status(models.TextChoices):
        # Someone who signed themselves up on the website. They have a login
        # and can ask for work, but there is no plan and nothing to pay yet.
        PENDING = "pending", "Pending setup"
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        CANCELLED = "cancelled", "Cancelled"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_account",
    )
    company_name = models.CharField(max_length=120)
    website_url = models.URLField(
        blank=True, help_text="The live site we built and host for this client."
    )
    plan = models.ForeignKey(
        Plan, null=True, blank=True, on_delete=models.SET_NULL, related_name="clients"
    )
    addons = models.ManyToManyField(AddOn, blank=True, related_name="clients")
    monthly_fee_override = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Set only to charge something other than the plan plus add-ons.",
    )
    next_payment_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    extra_services = models.JSONField(
        default=list,
        blank=True,
        help_text="Anything beyond the plan, as a list of strings.",
    )
    notes = models.TextField(blank=True, help_text="Internal. Never shown to the client.")

    class Meta:
        ordering = ["company_name"]

    def __str__(self) -> str:
        return f"{self.company_name} ({self.user.get_username()})"

    @property
    def currency(self) -> str:
        if self.plan:
            return self.plan.currency
        first_addon = self.addons.first()
        return first_addon.currency if first_addon else "ZAR"

    @property
    def monthly_total(self) -> Decimal:
        """What this client pays each month.

        An override wins outright. Otherwise it is the plan fee plus every
        add-on they have, which is how the quote on the website is built.
        """
        if self.monthly_fee_override is not None:
            return self.monthly_fee_override
        total = self.plan.monthly_fee if self.plan else Decimal("0.00")
        for addon in self.addons.all():
            total += addon.monthly_fee
        return total

    @property
    def services(self) -> list[str]:
        """Everything this client is getting, for display in the portal."""
        items: list[str] = []
        if self.plan:
            items.extend(self.plan.features)
        items.extend(addon.name for addon in self.addons.all())
        items.extend(str(service) for service in (self.extra_services or []))
        # Preserve order while dropping duplicates.
        seen: set[str] = set()
        return [i for i in items if not (i in seen or seen.add(i))]


class Invoice(TimeStampedModel):
    """A single amount a client owes, and whether it has been settled."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        DUE = "due", "Due"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"
        VOID = "void", "Void"

    account = models.ForeignKey(
        ClientAccount, on_delete=models.CASCADE, related_name="invoices"
    )
    number = models.CharField(max_length=40, unique=True)
    description = models.CharField(max_length=200, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="ZAR")
    issued_on = models.DateField()
    due_on = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DUE)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-issued_on", "-id"]

    def __str__(self) -> str:
        return f"{self.number} - {self.account.company_name}"

    @property
    def is_payable(self) -> bool:
        return self.status in {self.Status.DUE, self.Status.OVERDUE}


class Payment(TimeStampedModel):
    """An attempt to settle an invoice through a payment gateway.

    A row is created when the client starts a payment and updated when the
    gateway reports back, so an abandoned attempt leaves a trace rather than
    disappearing.
    """

    class Status(models.TextChoices):
        STARTED = "started", "Started"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    provider = models.CharField(max_length=40, default="paystack")
    # Ours, generated here and sent to the gateway. Unique and never blank, so
    # a callback carrying an empty reference cannot match some other payment.
    reference = models.CharField(
        max_length=64, unique=True, default=new_payment_reference, editable=False
    )
    # Whatever the gateway calls this transaction on their side.
    provider_reference = models.CharField(max_length=120, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="ZAR")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.STARTED)
    # Whatever the gateway sent back, kept verbatim for reconciling disputes.
    provider_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.provider} {self.get_status_display()} for {self.invoice.number}"


class ServiceRequest(TimeStampedModel):
    """Extra work a signed-in client has asked for from inside the portal.

    Separate from ``ProjectRequest``, which is the public form a stranger fills
    in. This one always belongs to an account, so there is no name or email to
    collect and no way to raise it on somebody else's behalf.
    """

    class Service(models.TextChoices):
        WEBSITE = "website", "A website"
        REDESIGN = "redesign", "Website redesign"
        DASHBOARD = "dashboard", "Live dashboard"
        MARKETING = "marketing", "Marketing"
        ECOMMERCE = "ecommerce", "Online shop"
        SEO = "seo", "SEO and search"
        BUSINESS_EMAIL = "business_email", "Business email address"
        SUPPORT = "support", "Changes to my current site"
        OTHER = "other", "Something else"

    class Status(models.TextChoices):
        NEW = "new", "Received"
        QUOTED = "quoted", "Quoted"
        ACCEPTED = "accepted", "In progress"
        DECLINED = "declined", "Declined"
        DONE = "done", "Done"

    account = models.ForeignKey(
        ClientAccount, on_delete=models.CASCADE, related_name="service_requests"
    )
    service = models.CharField(max_length=20, choices=Service.choices)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    internal_notes = models.TextField(
        blank=True, help_text="Internal. Never shown to the client."
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "service request"

    def __str__(self) -> str:
        return f"{self.get_service_display()} for {self.account.company_name}"
