from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import (
    AddOn,
    ClientAccount,
    ContactInquiry,
    Invoice,
    Plan,
    ProjectRequest,
    ServiceRequest,
)

User = get_user_model()


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


class ServiceRequestSerializer(serializers.ModelSerializer):
    """A client asking for extra work, and the state of that ask.

    ``account`` is not a field. It comes from the session in the view, so a
    request can never be filed against somebody else's account. ``status`` and
    ``internal_notes`` are ours to set, so neither is writable here.
    """

    service_label = serializers.CharField(source="get_service_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ServiceRequest
        fields = [
            "id",
            "service",
            "service_label",
            "details",
            "status",
            "status_label",
            "created_at",
        ]
        read_only_fields = ["id", "service_label", "status", "status_label", "created_at"]


def _single_line(value: str) -> str:
    """Collapses every run of whitespace, newlines included, to one space."""
    return " ".join(value.split())


class RegisterSerializer(serializers.Serializer):
    """Someone creating their own login from the website.

    Deliberately narrow. A visitor supplies who they are and a password, and
    nothing else: the plan, the fees and the account status are set by us, so
    there is no field here that could put someone on a free plan or mark their
    account active before we have spoken to them.
    """

    name = serializers.CharField(max_length=150, trim_whitespace=True)
    email = serializers.EmailField()
    company_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    password = serializers.CharField(
        style={"input_type": "password"}, trim_whitespace=False, write_only=True
    )

    def validate_name(self, value: str) -> str:
        return _single_line(value)

    def validate_company_name(self, value: str) -> str:
        # Both of these end up in the subject line of the email that tells us
        # about the sign-up, and a newline in a mail header is not allowed.
        # Django would refuse to send rather than let one through, so this is
        # about the notification still arriving, not about injection.
        return _single_line(value)

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "That email already has an account. Try signing in instead."
            )
        if User.objects.filter(username__iexact=email).exists():
            raise serializers.ValidationError(
                "That email already has an account. Try signing in instead."
            )
        return email

    def validate(self, attrs: dict) -> dict:
        # Run Django's own password rules, with the user's details in hand so
        # a password that is just their name or email is rejected too.
        candidate = User(
            username=attrs.get("email", ""),
            email=attrs.get("email", ""),
            first_name=attrs.get("name", "").split(" ")[0],
        )
        try:
            validate_password(attrs["password"], candidate)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": list(error.messages)}) from error
        return attrs
