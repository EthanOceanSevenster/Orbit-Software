"""The owner's dashboard.

This endpoint is the one place that returns every client's details at once, so
the tests that matter most are about who can call it. The rest cover the sums,
because a dashboard that quietly reports the wrong revenue is worse than one
that does not load.
"""

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import AddOn, ClientAccount, Invoice, Plan, ServiceRequest

User = get_user_model()


class StaffOverviewTests(APITestCase):
    def setUp(self):
        self.plan = Plan.objects.create(
            name="Website Build & Hosting",
            slug="plan-s",
            setup_fee=Decimal("500.00"),
            monthly_fee=Decimal("120.00"),
            features=["Hosting"],
        )
        self.addon = AddOn.objects.create(
            name="Business email", slug="email-s", monthly_fee=Decimal("50.00")
        )
        self.owner = User.objects.create_superuser(
            "owner@example.com", "owner@example.com", "owner-pw-123"
        )

        today = date.today()

        # Active, on a plan plus an add-on, owes one invoice.
        self.active_user = User.objects.create_user(
            "ann@example.com", "ann@example.com", "pw-ann-123"
        )
        self.active = ClientAccount.objects.create(
            user=self.active_user,
            company_name="Ann Ltd",
            plan=self.plan,
            status=ClientAccount.Status.ACTIVE,
            notes="internal only",
        )
        self.active.addons.add(self.addon)
        Invoice.objects.create(
            account=self.active,
            number="INV-S-1",
            amount=Decimal("170.00"),
            issued_on=today,
            due_on=today + timedelta(days=7),
            status=Invoice.Status.DUE,
        )
        Invoice.objects.create(
            account=self.active,
            number="INV-S-2",
            amount=Decimal("999.00"),
            issued_on=today - timedelta(days=40),
            due_on=today - timedelta(days=33),
            status=Invoice.Status.PAID,
        )

        # Pending, no plan, one open request.
        self.pending_user = User.objects.create_user(
            "ben@example.com", "ben@example.com", "pw-ben-123"
        )
        self.pending = ClientAccount.objects.create(
            user=self.pending_user,
            company_name="Ben Ltd",
            status=ClientAccount.Status.PENDING,
        )
        ServiceRequest.objects.create(account=self.pending, service="dashboard")
        ServiceRequest.objects.create(
            account=self.pending, service="seo", status=ServiceRequest.Status.DONE
        )

        # Paused, on a plan. Must not count towards recurring revenue.
        self.paused_user = User.objects.create_user(
            "cat@example.com", "cat@example.com", "pw-cat-123"
        )
        ClientAccount.objects.create(
            user=self.paused_user,
            company_name="Cat Ltd",
            plan=self.plan,
            status=ClientAccount.Status.PAUSED,
        )

    # --- who may look -----------------------------------------------------

    def test_requires_sign_in(self):
        response = self.client.get(reverse("staff-overview"))
        self.assertIn(response.status_code, (401, 403))

    def test_a_client_is_refused(self):
        """The one endpoint that returns everybody must not open to a client."""
        self.client.force_login(self.active_user)
        response = self.client.get(reverse("staff-overview"))
        self.assertEqual(response.status_code, 403)
        self.assertNotIn("Ben Ltd", response.content.decode())

    def test_the_owner_sees_every_client(self):
        self.client.force_login(self.owner)
        response = self.client.get(reverse("staff-overview"))
        self.assertEqual(response.status_code, 200)
        names = {c["company_name"] for c in response.json()["clients"]}
        self.assertEqual(names, {"Ann Ltd", "Ben Ltd", "Cat Ltd"})

    def test_me_reports_whether_the_login_is_staff(self):
        """The website uses this to decide whether to offer the dashboard."""
        self.client.force_login(self.active_user)
        self.assertIs(self.client.get(reverse("auth-me")).json()["is_staff"], False)

        self.client.force_login(self.owner)
        self.assertIs(self.client.get(reverse("auth-me")).json()["is_staff"], True)

    # --- the numbers ------------------------------------------------------

    def test_recurring_revenue_counts_only_active_clients(self):
        """A paused client still has a plan but is not paying."""
        self.client.force_login(self.owner)
        totals = self.client.get(reverse("staff-overview")).json()["totals"]
        # Ann: 120 plan + 50 add-on. Ben: no plan. Cat: paused.
        self.assertEqual(Decimal(totals["monthly_recurring"]), Decimal("170.00"))

    def test_outstanding_ignores_paid_invoices(self):
        self.client.force_login(self.owner)
        totals = self.client.get(reverse("staff-overview")).json()["totals"]
        self.assertEqual(Decimal(totals["outstanding"]), Decimal("170.00"))

    def test_counts_clients_by_status(self):
        self.client.force_login(self.owner)
        totals = self.client.get(reverse("staff-overview")).json()["totals"]
        self.assertEqual(totals["clients"], 3)
        self.assertEqual(totals["by_status"]["active"], 1)
        self.assertEqual(totals["by_status"]["pending"], 1)
        self.assertEqual(totals["by_status"]["paused"], 1)

    def test_only_unanswered_requests_are_queued(self):
        """A request marked done is finished and should drop off the list."""
        self.client.force_login(self.owner)
        body = self.client.get(reverse("staff-overview")).json()
        self.assertEqual(body["totals"]["open_requests"], 1)
        self.assertEqual(len(body["requests"]), 1)
        self.assertEqual(body["requests"][0]["service"], "dashboard")
        self.assertEqual(body["requests"][0]["company_name"], "Ben Ltd")

    def test_each_client_carries_their_own_totals(self):
        self.client.force_login(self.owner)
        clients = {c["company_name"]: c for c in self.client.get(
            reverse("staff-overview")
        ).json()["clients"]}

        ann = clients["Ann Ltd"]
        self.assertEqual(Decimal(ann["outstanding"]), Decimal("170.00"))
        self.assertEqual(ann["invoice_count"], 2)
        self.assertEqual(ann["open_requests"], 0)
        self.assertEqual(ann["contact_email"], "ann@example.com")

        ben = clients["Ben Ltd"]
        self.assertEqual(Decimal(ben["outstanding"]), Decimal("0.00"))
        self.assertEqual(ben["open_requests"], 1)

    def test_internal_notes_are_not_in_the_dashboard(self):
        """They are the owner's, but the dashboard is for scanning, not notes."""
        self.client.force_login(self.owner)
        response = self.client.get(reverse("staff-overview"))
        self.assertNotIn("internal only", response.content.decode())
