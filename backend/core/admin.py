from django.contrib import admin

from .models import AddOn, ContactInquiry, Plan, ProjectRequest


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
