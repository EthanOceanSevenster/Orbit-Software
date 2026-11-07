"""Service requests raised from inside the client portal.

A signed-in client asks for extra work here: a dashboard, marketing, a redesign.
The account always comes from the session, never from the request body, so a
request cannot be filed against somebody else's account and the list can only
ever return the caller's own rows.
"""

from rest_framework import generics
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle

from .models import ServiceRequest
from .notifications import notify_new_submission
from .serializers import ServiceRequestSerializer


class ServiceRequestThrottle(UserRateThrottle):
    """Per-account, not per-IP: these calls are always authenticated."""

    scope = "service-request"


class ServiceRequestListCreateView(generics.ListCreateAPIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ServiceRequestSerializer
    throttle_classes = [ServiceRequestThrottle]

    def get_account(self):
        return getattr(self.request.user, "client_account", None)

    def get_queryset(self):
        account = self.get_account()
        if account is None:
            return ServiceRequest.objects.none()
        return ServiceRequest.objects.filter(account=account)

    def perform_create(self, serializer):
        account = self.get_account()
        if account is None:
            # A login with no account attached. Nothing to hang the request on,
            # and inventing one here would skip the checks the admin does.
            raise PermissionDenied(
                "This login is not linked to a client account yet. "
                "Get in touch and we will connect it."
            )

        request = serializer.save(account=account)
        notify_new_submission(
            subject=f"Service request from {account.company_name}: {request.get_service_display()}",
            body="\n".join(
                [
                    f"Company: {account.company_name}",
                    f"Service: {request.get_service_display()}",
                    f"Account status: {account.get_status_display()}",
                    "",
                    request.details or "(no extra detail given)",
                ]
            ),
            reply_to=account.user.email or None,
        )
