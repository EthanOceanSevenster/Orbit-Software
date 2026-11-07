from django.http import JsonResponse
from rest_framework import generics
from rest_framework.throttling import AnonRateThrottle

from .models import AddOn, Plan
from .notifications import notify_new_submission
from .serializers import (
    AddOnSerializer,
    ContactInquirySerializer,
    PlanSerializer,
    ProjectRequestSerializer,
)


class FormSubmitThrottle(AnonRateThrottle):
    scope = "form-submit"


def health(request):
    return JsonResponse({"status": "ok"})


class PlanListView(generics.ListAPIView):
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer


class PlanDetailView(generics.RetrieveAPIView):
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    lookup_field = "slug"


class AddOnListView(generics.ListAPIView):
    queryset = AddOn.objects.filter(is_active=True)
    serializer_class = AddOnSerializer


class ContactInquiryCreateView(generics.CreateAPIView):
    serializer_class = ContactInquirySerializer
    throttle_classes = [FormSubmitThrottle]

    def perform_create(self, serializer):
        inquiry = serializer.save()
        notify_new_submission(
            subject=f"New contact inquiry from {inquiry.name}",
            body="\n".join(
                [
                    f"Name: {inquiry.name}",
                    f"Email: {inquiry.email}",
                    f"Company: {inquiry.company or '-'}",
                    "",
                    inquiry.message,
                ]
            ),
            reply_to=inquiry.email,
        )


class ProjectRequestCreateView(generics.CreateAPIView):
    serializer_class = ProjectRequestSerializer
    throttle_classes = [FormSubmitThrottle]

    def perform_create(self, serializer):
        req = serializer.save()
        notify_new_submission(
            subject=f"New project request from {req.name}",
            body="\n".join(
                [
                    f"Name: {req.name}",
                    f"Email: {req.email}",
                    f"Phone: {req.phone or '-'}",
                    f"Company: {req.company or '-'}",
                    f"Plan: {req.plan.name if req.plan else '-'}",
                    f"Website type: {req.get_website_type_display()}",
                    "",
                    req.details,
                ]
            ),
            reply_to=req.email,
        )
