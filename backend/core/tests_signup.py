"""Self sign-up, and service requests raised from inside the portal.

Both are new public doors into the system, so these cover what a visitor is
allowed to create: that registering cannot put anyone on a plan or mark an
account active, and that a service request can only ever land on the caller's
own account.
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, TestCase
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import ClientAccount, Plan, ServiceRequest
from .serializers import RegisterSerializer

User = get_user_model()

GOOD_PASSWORD = "k7-marula-ridge"


def signup_payload(**overrides) -> dict:
    data = {
        "name": "Thandi Mokoena",
        "email": "thandi@example.com",
        "company_name": "Mokoena Trading",
        "password": GOOD_PASSWORD,
    }
    data.update(overrides)
    return data


class ThrottleResetMixin:
    """Clears the throttle history between tests.

    DRF counts requests in the default cache, which is process-wide and is not
    reset by the test database rollback. Without this, the sixth sign-up test
    to run gets a 429 from the ones before it rather than exercising its own
    case.
    """

    def setUp(self):
        super().setUp()
        cache.clear()
        self.addCleanup(cache.clear)


class RegisterTests(ThrottleResetMixin, APITestCase):
    def test_creates_a_login_and_a_pending_account(self):
        response = self.client.post(reverse("auth-register"), signup_payload(), format="json")
        self.assertEqual(response.status_code, 201)

        user = User.objects.get(email="thandi@example.com")
        self.assertEqual(user.first_name, "Thandi")
        self.assertEqual(user.last_name, "Mokoena")
        self.assertTrue(user.check_password(GOOD_PASSWORD))

        account = ClientAccount.objects.get(user=user)
        self.assertEqual(account.company_name, "Mokoena Trading")
        self.assertEqual(account.status, ClientAccount.Status.PENDING)
        self.assertIsNone(account.plan)
        self.assertEqual(account.monthly_total, Decimal("0.00"))

    def test_registering_signs_them_in(self):
        self.client.post(reverse("auth-register"), signup_payload(), format="json")
        self.assertIn("_auth_user_id", self.client.session)

    def test_a_new_account_gets_no_admin_access(self):
        """Nothing about signing up may hand out staff rights."""
        self.client.post(reverse("auth-register"), signup_payload(), format="json")
        user = User.objects.get(email="thandi@example.com")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_cannot_put_itself_on_a_plan_or_go_active(self):
        """Fees and status are ours to set. Extra fields must be ignored."""
        plan = Plan.objects.create(
            name="Hosting", slug="hosting", setup_fee=Decimal("500"), monthly_fee=Decimal("120")
        )
        response = self.client.post(
            reverse("auth-register"),
            signup_payload(
                plan=plan.pk,
                status="active",
                monthly_fee_override="0.00",
                is_staff=True,
            ),
            format="json",
        )
        self.assertEqual(response.status_code, 201)

        account = ClientAccount.objects.get()
        self.assertIsNone(account.plan)
        self.assertEqual(account.status, ClientAccount.Status.PENDING)
        self.assertIsNone(account.monthly_fee_override)
        self.assertFalse(account.user.is_staff)

    def test_company_name_falls_back_to_their_own_name(self):
        self.client.post(
            reverse("auth-register"), signup_payload(company_name=""), format="json"
        )
        self.assertEqual(ClientAccount.objects.get().company_name, "Thandi Mokoena")

    def test_rejects_an_email_that_already_has_an_account(self):
        User.objects.create_user("thandi@example.com", "thandi@example.com", "pw-existing-1")
        response = self.client.post(reverse("auth-register"), signup_payload(), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())
        self.assertEqual(User.objects.count(), 1)

    def test_rejects_a_weak_password(self):
        response = self.client.post(
            reverse("auth-register"), signup_payload(password="12345678"), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.json())
        self.assertFalse(User.objects.exists())

    def test_a_newline_in_a_name_cannot_reach_the_mail_headers(self):
        """Both names end up in the notification subject, which is one line."""
        from django.core import mail

        response = self.client.post(
            reverse("auth-register"),
            signup_payload(
                name="Thandi\nBcc: someone@evil.test",
                company_name="A\r\nB",
            ),
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ClientAccount.objects.get().company_name, "A B")
        self.assertEqual(len(mail.outbox), 1)
        subject = mail.outbox[0].subject
        self.assertNotIn("\n", subject)
        self.assertNotIn("\r", subject)
        self.assertNotIn("Bcc:", subject)

    def test_a_duplicate_email_race_answers_like_the_check(self):
        """Two sign-ups at once both clear the check; the database still refuses.

        The serializer looks the address up and then the view writes it, so a
        second request arriving in between passes validation and loses at the
        unique constraint. Bypassing the check is how that moment is reached.
        """
        from unittest import mock

        User.objects.create_user("thandi@example.com", "thandi@example.com", "pw-race-1")

        with mock.patch.object(
            RegisterSerializer, "validate_email", side_effect=lambda value: value.lower()
        ):
            response = self.client.post(
                reverse("auth-register"), signup_payload(), format="json"
            )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())
        self.assertEqual(User.objects.count(), 1)
        self.assertFalse(ClientAccount.objects.exists())

    def test_nothing_is_created_when_the_form_is_rejected(self):
        """The user and the account are written together or not at all."""
        self.client.post(
            reverse("auth-register"), signup_payload(password="password"), format="json"
        )
        self.assertFalse(User.objects.exists())
        self.assertFalse(ClientAccount.objects.exists())


class RegisterCsrfTests(ThrottleResetMixin, TestCase):
    """Same hole as login: DRF exempts APIView and the caller is anonymous."""

    def test_register_without_a_csrf_token_is_rejected(self):
        client = Client(enforce_csrf_checks=True)
        response = client.post(
            reverse("auth-register"),
            signup_payload(),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(User.objects.exists())

    def test_register_with_a_csrf_token_succeeds(self):
        client = Client(enforce_csrf_checks=True)
        client.get(reverse("auth-csrf"))
        token = client.cookies["csrftoken"].value
        response = client.post(
            reverse("auth-register"),
            signup_payload(),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 201)


class ServiceRequestTests(ThrottleResetMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.alice = User.objects.create_user(
            "alice@example.com", "alice@example.com", "pw-alice-123"
        )
        self.alice_account = ClientAccount.objects.create(
            user=self.alice, company_name="Alice Ltd"
        )
        self.bob = User.objects.create_user("bob@example.com", "bob@example.com", "pw-bob-123")
        self.bob_account = ClientAccount.objects.create(user=self.bob, company_name="Bob Ltd")

    def test_requires_sign_in(self):
        response = self.client.post(
            reverse("service-request-list"), {"service": "dashboard"}, format="json"
        )
        self.assertIn(response.status_code, (401, 403))
        self.assertFalse(ServiceRequest.objects.exists())

    def test_files_the_request_against_the_callers_own_account(self):
        """`account` is not a writable field, so a supplied one must be ignored."""
        self.client.force_login(self.alice)
        response = self.client.post(
            reverse("service-request-list"),
            {
                "service": "dashboard",
                "details": "Sales and stock on one screen.",
                "account": self.bob_account.pk,
                "status": "done",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)

        request = ServiceRequest.objects.get()
        self.assertEqual(request.account, self.alice_account)
        self.assertEqual(request.status, ServiceRequest.Status.NEW)

    def test_a_client_only_sees_their_own_requests(self):
        ServiceRequest.objects.create(account=self.alice_account, service="marketing")
        self.client.force_login(self.bob)
        response = self.client.get(reverse("service-request-list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_internal_notes_are_never_sent_to_the_client(self):
        ServiceRequest.objects.create(
            account=self.alice_account,
            service="marketing",
            internal_notes="Quote high, they can afford it",
        )
        self.client.force_login(self.alice)
        response = self.client.get(reverse("service-request-list"))
        self.assertNotIn("internal_notes", response.json()[0])
        self.assertNotIn("Quote high", response.content.decode())

    def test_rejects_a_service_we_do_not_offer(self):
        self.client.force_login(self.alice)
        response = self.client.post(
            reverse("service-request-list"), {"service": "free-stuff"}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(ServiceRequest.objects.exists())

    def test_a_login_with_no_account_cannot_file_one(self):
        loner = User.objects.create_user("loner@example.com", "loner@example.com", "pw-loner-1")
        self.client.force_login(loner)
        response = self.client.post(
            reverse("service-request-list"), {"service": "seo"}, format="json"
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(ServiceRequest.objects.exists())

    def test_the_client_can_follow_the_status_we_set(self):
        request = ServiceRequest.objects.create(
            account=self.alice_account, service="dashboard"
        )
        request.status = ServiceRequest.Status.QUOTED
        request.save()

        self.client.force_login(self.alice)
        body = self.client.get(reverse("service-request-list")).json()[0]
        self.assertEqual(body["status"], "quoted")
        self.assertEqual(body["status_label"], "Quoted")
        self.assertEqual(body["service_label"], "Live dashboard")
