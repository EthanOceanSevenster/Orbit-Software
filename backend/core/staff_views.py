"""The owner's own view of the business: every client, and what they owe.

Staff only, enforced by IsAdminUser, which checks ``is_staff``. Clients created
through the portal or the admin are never staff, so this is closed to them. It
is a separate module from the client-facing views so there is one obvious place
to look when asking what the owner can see that a client cannot.
"""

from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ClientAccount, Invoice, ServiceRequest
from .serializers import (
    StaffClientSerializer,
    StaffInvoiceSerializer,
    StaffServiceRequestSerializer,
)

UNPAID = [Invoice.Status.DUE, Invoice.Status.OVERDUE]
OPEN_REQUESTS = [ServiceRequest.Status.NEW, ServiceRequest.Status.QUOTED]


class StaffOverviewView(APIView):
    """Everything the dashboard needs, in one request.

    One call rather than three, because the page shows them together and a
    half-loaded dashboard is worse than a slightly larger response.
    """

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        accounts = (
            ClientAccount.objects.select_related("user", "plan")
            .prefetch_related("addons")
            .annotate(
                outstanding_total=Sum(
                    "invoices__amount", filter=Q(invoices__status__in=UNPAID)
                ),
                invoice_total=Count("invoices", distinct=True),
                open_request_total=Count(
                    "service_requests",
                    filter=Q(service_requests__status__in=OPEN_REQUESTS),
                    distinct=True,
                ),
            )
            .order_by("company_name")
        )

        clients = list(accounts)

        # monthly_total is a property, not a column, so the recurring revenue
        # is summed in Python. Fine at this size, and it keeps one definition
        # of what a client pays instead of repeating the rule in SQL.
        active = [c for c in clients if c.status == ClientAccount.Status.ACTIVE]
        recurring = sum((c.monthly_total for c in active), Decimal("0.00"))
        outstanding = sum(
            (c.outstanding_total or Decimal("0.00") for c in clients), Decimal("0.00")
        )

        requests = (
            ServiceRequest.objects.select_related("account", "account__user")
            .filter(status__in=OPEN_REQUESTS)
            .order_by("-created_at")[:20]
        )

        by_status = {status: 0 for status, _ in ClientAccount.Status.choices}
        for client in clients:
            by_status[client.status] = by_status.get(client.status, 0) + 1

        # Money actually received, which is a different question from what is
        # billed. An invoice counts once it is marked paid, and paid_at is when
        # that happened rather than when it was raised.
        paid = Invoice.objects.filter(status=Invoice.Status.PAID).select_related(
            "account", "account__user"
        )
        month_start = timezone.now().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        received_total = paid.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        received_month = paid.filter(paid_at__gte=month_start).aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")

        unpaid = (
            Invoice.objects.filter(status__in=UNPAID)
            .select_related("account", "account__user")
            .order_by("due_on")
        )

        return Response(
            {
                "totals": {
                    "clients": len(clients),
                    "by_status": by_status,
                    "monthly_recurring": str(recurring),
                    "outstanding": str(outstanding),
                    "overdue_invoices": Invoice.objects.filter(
                        status=Invoice.Status.OVERDUE
                    ).count(),
                    "open_requests": ServiceRequest.objects.filter(
                        status__in=OPEN_REQUESTS
                    ).count(),
                    "received_total": str(received_total),
                    "received_this_month": str(received_month),
                    "payments_count": paid.count(),
                    "unpaid_invoices": unpaid.count(),
                    "currency": "ZAR",
                },
                "clients": StaffClientSerializer(clients, many=True).data,
                "requests": StaffServiceRequestSerializer(requests, many=True).data,
                "payments": StaffInvoiceSerializer(
                    paid.order_by("-paid_at")[:30], many=True
                ).data,
                "unpaid": StaffInvoiceSerializer(unpaid[:30], many=True).data,
            }
        )
