from rest_framework import serializers

from .models import (
    AddOn,
    ClientAccount,
    ContactInquiry,
    Invoice,
    Plan,
    ProjectRequest,
)


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            "id",
            "name",
            "slug",
            "tagline",
            "description",
            "setup_fee",
            "monthly_fee",
            "currency",
            "features",
            "is_featured",
        ]
        read_only_fields = fields


class AddOnSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddOn
        fields = ["id", "name", "slug", "description", "monthly_fee", "currency"]
        read_only_fields = fields


class ContactInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactInquiry
        fields = ["id", "name", "email", "company", "message", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProjectRequestSerializer(serializers.ModelSerializer):
    plan = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Plan.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ProjectRequest
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "company",
            "plan",
            "website_type",
            "details",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ClientAccountSerializer(serializers.ModelSerializer):
    """What a signed-in client sees about their own account.

    Read-only, and deliberately narrow: `notes` is internal and must never
    appear here.
    """

    monthly_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    currency = serializers.CharField(read_only=True)
    services = serializers.ListField(child=serializers.CharField(), read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True, default="")
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ClientAccount
        fields = [
            "company_name",
            "website_url",
            "plan_name",
            "monthly_total",
            "currency",
            "next_payment_date",
            "status",
            "status_label",
            "services",
        ]
        read_only_fields = fields


class InvoiceSerializer(serializers.ModelSerializer):
    is_payable = serializers.BooleanField(read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "number",
            "description",
            "amount",
            "currency",
            "issued_on",
            "due_on",
            "status",
            "status_label",
            "is_payable",
            "paid_at",
        ]
        read_only_fields = fields
