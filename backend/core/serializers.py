from rest_framework import serializers

from .models import AddOn, ContactInquiry, Plan, ProjectRequest


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
