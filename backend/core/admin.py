from django import forms
from django.contrib import admin
from django.contrib.auth import get_user_model

from .passwords import generate_password

from .models import (
    AddOn,
    ClientAccount,
    ContactInquiry,
    Invoice,
    Payment,
    Plan,
    ProjectRequest,
    ServiceRequest,
)


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "setup_fee",
        "monthly_fee",
        "currency",
        "is_featured",
        "is_active",
        "sort_order",
    )
    list_editable = ("is_featured", "is_active", "sort_order")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")


@admin.register(ContactInquiry)
class ContactInquiryAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "company", "created_at", "is_resolved")
    list_filter = ("is_resolved", "created_at")
    list_editable = ("is_resolved",)
    search_fields = ("name", "email", "company", "message")
    readonly_fields = ("created_at", "updated_at")


@admin.register(ProjectRequest)
class ProjectRequestAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "email",
        "company",
        "website_type",
        "plan",
        "status",
        "created_at",
    )
    list_filter = ("status", "website_type", "plan", "created_at")
    list_editable = ("status",)
    search_fields = ("name", "email", "company", "details")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Contact", {"fields": ("name", "email", "phone", "company")}),
        ("Project", {"fields": ("plan", "website_type", "existing_site_url", "details")}),
        ("Internal", {"fields": ("status", "internal_notes", "created_at", "updated_at")}),
    )


@admin.register(AddOn)
class AddOnAdmin(admin.ModelAdmin):
    list_display = ("name", "monthly_fee", "currency", "is_active", "sort_order")
    list_editable = ("monthly_fee", "is_active", "sort_order")
    prepopulated_fields = {"slug": ("name",)}


class InvoiceInline(admin.TabularInline):
    model = Invoice
    extra = 0
    fields = ("number", "description", "amount", "issued_on", "due_on", "status", "paid_at")
    readonly_fields = ("paid_at",)
    show_change_link = True


class ClientAccountCreationForm(forms.ModelForm):
    """Creates the login and the account together.

    Render's free plan has no shell, so the admin page has to be able to do
    the whole job. The password is generated here and shown once on screen.
    """

    client_name = forms.CharField(
        max_length=150,
        label="Client's full name",
        help_text="Used on their login, e.g. Phakama Ndamase.",
    )
    client_email = forms.EmailField(
        label="Client's email",
        help_text="This is what they sign in with.",
    )

    class Meta:
        model = ClientAccount
        exclude = ["user"]

    def clean_client_email(self):
        email = self.cleaned_data["client_email"].strip().lower()
        User = get_user_model()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("Someone already signs in with that email.")
        if User.objects.filter(username=email).exists():
            raise forms.ValidationError("That email is already taken as a username.")
        return email


@admin.register(ClientAccount)
class ClientAccountAdmin(admin.ModelAdmin):
    add_form = ClientAccountCreationForm

    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            kwargs["form"] = self.add_form
        return super().get_form(request, obj, **kwargs)

    def get_fieldsets(self, request, obj=None):
        if obj is None:
            # A flat form on add: the user does not exist yet, so the normal
            # fieldsets would show a user picker that cannot be satisfied.
            return (
                (
                    "New client",
                    {
                        "fields": ("client_name", "client_email", "company_name", "website_url"),
                        "description": (
                            "A login is created with a generated password, shown "
                            "once on the next screen."
                        ),
                    },
                ),
                ("What they pay for", {"fields": ("plan", "addons", "extra_services")}),
                ("Billing", {"fields": ("monthly_fee_override", "next_payment_date", "status")}),
                ("Internal", {"fields": ("notes",)}),
            )
        return super().get_fieldsets(request, obj)

    def get_readonly_fields(self, request, obj=None):
        if obj is None:
            return ()
        return self.readonly_fields

    def save_model(self, request, obj, form, change):
        if not change:
            User = get_user_model()
            email = form.cleaned_data["client_email"]
            name = form.cleaned_data["client_name"].strip()
            parts = name.split()
            password = generate_password()
            obj.user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=parts[0] if parts else "",
                last_name=" ".join(parts[1:]) if len(parts) > 1 else "",
            )
            # Shown once. Nothing stores it, and nothing can recover it.
            self.message_user(
                request,
                f"Login created. Email: {email}  Password: {password}  "
                "Copy it now, it is not shown again. Send it over something "
                "other than email if you can.",
            )
        super().save_model(request, obj, form, change)

    list_display = (
        "company_name",
        "user",
        "plan",
        "monthly_total",
        "next_payment_date",
        "status",
    )
    list_filter = ("status", "plan")
    search_fields = ("company_name", "user__username", "user__email", "website_url")
    filter_horizontal = ("addons",)
    readonly_fields = ("created_at", "updated_at")
    inlines = [InvoiceInline]
    fieldsets = (
        ("Who", {"fields": ("user", "company_name", "website_url")}),
        ("What they pay for", {"fields": ("plan", "addons", "extra_services")}),
        (
            "Billing",
            {
                "fields": ("monthly_fee_override", "next_payment_date", "status"),
                "description": (
                    "Leave the override blank to charge the plan plus add-ons. "
                    "Set it only to charge something different."
                ),
            },
        ),
        ("Internal", {"fields": ("notes", "created_at", "updated_at")}),
    )

    @admin.display(description="Monthly")
    def monthly_total(self, obj):
        return f"{obj.currency} {obj.monthly_total}"


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    fields = ("provider", "status", "amount", "provider_reference", "created_at")
    readonly_fields = fields
    can_delete = False


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("number", "account", "amount", "currency", "due_on", "status", "paid_at")
    list_filter = ("status", "issued_on", "due_on")
    search_fields = ("number", "account__company_name", "description")
    readonly_fields = ("paid_at", "created_at", "updated_at")
    inlines = [PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("invoice", "provider", "status", "amount", "created_at")
    list_filter = ("status", "provider")
    search_fields = ("invoice__number", "provider_reference")
    # A payment record is evidence of what the gateway said. It is never edited
    # by hand, only read.
    readonly_fields = tuple(f.name for f in Payment._meta.fields)

    def has_add_permission(self, request):
        return False


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    """Extra work clients have asked for from inside the portal.

    The client sees the status, so changing it here is how you tell them where
    their request stands. ``internal_notes`` is never serialised to them.
    """

    list_display = ("account", "service", "status", "created_at")
    list_filter = ("status", "service", "created_at")
    list_editable = ("status",)
    search_fields = ("account__company_name", "account__user__email", "details")
    readonly_fields = ("account", "service", "details", "created_at", "updated_at")
    date_hierarchy = "created_at"

    fieldsets = (
        ("The request", {"fields": ("account", "service", "details", "created_at")}),
        ("Where it stands", {"fields": ("status", "internal_notes")}),
    )

    def has_add_permission(self, request):
        # These are raised by clients in the portal, never typed in here.
        return False
