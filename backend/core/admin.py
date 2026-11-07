from django.contrib import admin

from .models import (
    AddOn,
    ClientAccount,
    ContactInquiry,
    Invoice,
    Payment,
    Plan,
    ProjectRequest,
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


@admin.register(ClientAccount)
class ClientAccountAdmin(admin.ModelAdmin):
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
