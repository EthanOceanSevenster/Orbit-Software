from django.db import models


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
