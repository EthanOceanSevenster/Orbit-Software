from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from django.conf import settings

from .models import (
    AddOn,
    ClientAccount,
    ContactInquiry,
    Invoice,
    InvoiceLine,
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
        fields = ["id", "name", "slug", "description", "monthly_fee", "setup_fee", "currency"]
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

    contact_name = serializers.CharField(source="contact", read_only=True)
    billing_email = serializers.CharField(source="invoice_email", read_only=True)
    # Where to pay by EFT. The same settings that print on the invoice, so a
    # client reading the portal and a client reading a PDF see one account.
    pay_to = serializers.SerializerMethodField()

    def get_pay_to(self, account) -> dict:
        return {
            "name": getattr(settings, "BANK_NAME", ""),
            "account_name": getattr(settings, "BANK_ACCOUNT_NAME", ""),
            "account_number": getattr(settings, "BANK_ACCOUNT_NUMBER", ""),
            "branch_code": getattr(settings, "BANK_BRANCH_CODE", ""),
            "company_name": settings.COMPANY_NAME,
        }

    class Meta:
        model = ClientAccount
        fields = [
            "pay_to",
            "company_name",
            "website_url",
            "plan_name",
            "monthly_total",
            "currency",
            "next_payment_date",
            "status",
            "status_label",
            "services",
            "contact_name",
            "billing_email",
            "phone",
            "address",
            "vat_number",
            "client_since",
            "domain",
            "domain_renews_on",
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


class StaffClientSerializer(serializers.ModelSerializer):
    """One client as the owner sees them, for the dashboard.

    Wider than ClientAccountSerializer, which is what a client sees about
    themselves. This one carries the contact details and the money owed, and
    is only ever served behind a staff-only permission.
    """

    contact_name = serializers.SerializerMethodField()
    contact_email = serializers.CharField(source="user.email", read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True, default="")
    monthly_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    currency = serializers.CharField(read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    services = serializers.ListField(child=serializers.CharField(), read_only=True)
    outstanding = serializers.SerializerMethodField()
    invoice_count = serializers.SerializerMethodField()
    open_requests = serializers.SerializerMethodField()

    class Meta:
        model = ClientAccount
        fields = [
            "id",
            "company_name",
            "contact_name",
            "contact_email",
            "website_url",
            "plan_name",
            "monthly_total",
            "currency",
            "next_payment_date",
            "status",
            "status_label",
            "services",
            "outstanding",
            "invoice_count",
            "open_requests",
            "created_at",
        ]
        read_only_fields = fields

    def get_contact_name(self, account) -> str:
        return account.user.get_full_name() or account.user.get_username()

    def get_outstanding(self, account) -> str:
        # Annotated by the view so this is not a query per row.
        return str(getattr(account, "outstanding_total", None) or "0.00")

    def get_invoice_count(self, account) -> int:
        return getattr(account, "invoice_total", 0)

    def get_open_requests(self, account) -> int:
        return getattr(account, "open_request_total", 0)


class StaffServiceRequestSerializer(ServiceRequestSerializer):
    """A service request with the client attached, for the owner's queue."""

    company_name = serializers.CharField(source="account.company_name", read_only=True)
    contact_email = serializers.CharField(source="account.user.email", read_only=True)

    class Meta(ServiceRequestSerializer.Meta):
        fields = ServiceRequestSerializer.Meta.fields + ["company_name", "contact_email"]


class StaffInvoiceSerializer(serializers.ModelSerializer):
    """An invoice with the client attached, for the owner's payments view."""

    company_name = serializers.CharField(source="account.company_name", read_only=True)
    contact_email = serializers.CharField(source="account.user.email", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "number",
            "company_name",
            "contact_email",
            "description",
            "amount",
            "currency",
            "issued_on",
            "due_on",
            "status",
            "status_label",
            "paid_at",
        ]
        read_only_fields = fields


class InvoiceLineSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = InvoiceLine
        fields = ["description", "quantity", "unit_amount", "amount"]
        read_only_fields = fields


class InvoiceDocumentSerializer(serializers.ModelSerializer):
    """Everything needed to render one invoice as a document.

    Carries both sides: who it is from, who it is to, what it buys and how to
    pay it. The client's own details come from their account rather than being
    typed per invoice, so correcting an address fixes every future invoice.
    """

    lines = InvoiceLineSerializer(many=True, read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    is_payable = serializers.BooleanField(read_only=True)
    period_label = serializers.CharField(read_only=True)
    billed_to = serializers.SerializerMethodField()
    issued_by = serializers.SerializerMethodField()

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
            "period_start",
            "period_end",
            "period_label",
            "status",
            "status_label",
            "is_payable",
            "paid_at",
            "lines",
            "billed_to",
            "issued_by",
        ]
        read_only_fields = fields

    def get_billed_to(self, invoice) -> dict:
        account = invoice.account
        return {
            "company_name": account.company_name,
            "contact_name": account.contact,
            "email": account.invoice_email,
            "phone": account.phone,
            "address": account.address,
            "vat_number": account.vat_number,
        }

    def get_issued_by(self, invoice) -> dict:
        # Blank values are dropped by the page rather than printed as empty
        # rows, so a half-configured bank block never reaches a client.
        return {
            "company_name": settings.COMPANY_NAME,
            "location": getattr(settings, "COMPANY_LOCATION", ""),
            "email": getattr(settings, "PUBLIC_EMAIL", ""),
            "website": getattr(settings, "COMPANY_WEBSITE", ""),
            "vat_number": getattr(settings, "COMPANY_VAT_NUMBER", ""),
            "bank": {
                "name": getattr(settings, "BANK_NAME", ""),
                "account_name": getattr(settings, "BANK_ACCOUNT_NAME", ""),
                "account_number": getattr(settings, "BANK_ACCOUNT_NUMBER", ""),
                "branch_code": getattr(settings, "BANK_BRANCH_CODE", ""),
            },
        }
