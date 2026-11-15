"""Access control and payment settlement for the client portal.

These cover the ways money or data could leak: one client reading or paying
another's invoice, a forged payment callback settling an invoice for free, and
a login that can be triggered from a third-party page.
"""

import hashlib
import hmac
import json
from datetime import date, timedelta
from decimal import Decimal
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import Client, TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import ClientAccount, Invoice, Payment, Plan

User = get_user_model()


class PortalAccessTests(APITestCase):
    def setUp(self):
        self.plan = Plan.objects.create(
            name="Website Build & Hosting",
            slug="plan-a",
            setup_fee=Decimal("500.00"),
            monthly_fee=Decimal("120.00"),
            features=["Hosting"],
        )
        self.alice = User.objects.create_user(
            "alice@example.com", "alice@example.com", "pw-alice-123"
        )
        self.bob = User.objects.create_user("bob@example.com", "bob@example.com", "pw-bob-123")
        self.alice_account = ClientAccount.objects.create(
            user=self.alice,
            company_name="Alice Ltd",
            plan=self.plan,
            notes="internal only",
        )
        ClientAccount.objects.create(user=self.bob, company_name="Bob Ltd", plan=self.plan)
        self.alice_invoice = Invoice.objects.create(
            account=self.alice_account,
            number="INV-A-1",
            amount=Decimal("620.00"),
            issued_on=date(2026, 11, 1),
            due_on=date(2026, 11, 8),
        )

    def test_invoices_require_sign_in(self):
        response = self.client.get(reverse("invoice-list"))
        self.assertIn(response.status_code, (401, 403))

    def test_client_sees_only_their_own_invoices(self):
        self.client.force_login(self.bob)
        response = self.client.get(reverse("invoice-list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_client_cannot_pay_another_clients_invoice(self):
        """An invoice id from the URL must not reach another tenant."""
        self.client.force_login(self.bob)
        response = self.client.post(reverse("invoice-pay", args=[self.alice_invoice.pk]))
        self.assertEqual(response.status_code, 404)

    def test_account_never_exposes_internal_notes(self):
        self.client.force_login(self.alice)
        response = self.client.get(reverse("auth-me"))
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("notes", response.json())
        self.assertNotIn("internal only", response.content.decode())

    def test_payment_reference_is_generated_and_unique(self):
        """A blank reference would let a callback match somebody else's payment."""
        first = Payment.objects.create(
            invoice=self.alice_invoice, amount=Decimal("620.00"), currency="ZAR"
        )
        second = Payment.objects.create(
            invoice=self.alice_invoice, amount=Decimal("620.00"), currency="ZAR"
        )
        self.assertTrue(first.reference)
        self.assertNotEqual(first.reference, second.reference)


class PaymentSettlementTests(APITestCase):
    def setUp(self):
        plan = Plan.objects.create(
            name="Plan", slug="plan-b", setup_fee=Decimal("500"), monthly_fee=Decimal("120")
        )
        self.user = User.objects.create_user("dee@example.com", "dee@example.com", "pw-dee-123")
        account = ClientAccount.objects.create(user=self.user, company_name="Dee Ltd", plan=plan)
        self.invoice = Invoice.objects.create(
            account=account,
            number="INV-D-1",
            amount=Decimal("620.00"),
            issued_on=date(2026, 11, 1),
            due_on=date(2026, 11, 8),
        )

    @override_settings(PAYSTACK_SECRET_KEY="")
    def test_pay_is_refused_while_payments_are_switched_off(self):
        self.client.force_login(self.user)
        response = self.client.post(reverse("invoice-pay", args=[self.invoice.pk]))
        self.assertEqual(response.status_code, 503)
        self.assertIs(response.json()["configured"], False)

    @override_settings(PAYSTACK_SECRET_KEY="")
    def test_webhook_refuses_to_verify_without_a_key(self):
        """An HMAC with an empty secret is computable by anyone, so fail closed."""
        response = self.client.post(
            reverse("paystack-webhook"), {"event": "charge.success"}, format="json"
        )
        self.assertEqual(response.status_code, 503)

    @override_settings(PAYSTACK_SECRET_KEY="sk_test_abc")
    def test_webhook_rejects_a_forged_signature(self):
        response = self.client.post(
            reverse("paystack-webhook"),
            {"event": "charge.success", "data": {"reference": "anything"}},
            format="json",
            HTTP_X_PAYSTACK_SIGNATURE="not-a-real-signature",
        )
        self.assertEqual(response.status_code, 401)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.DUE)

    @override_settings(PAYSTACK_SECRET_KEY="sk_test_abc")
    def test_signed_webhook_still_confirms_with_paystack(self):
        """A signed webhook is a nudge to go and look, never the answer itself."""
        payment = Payment.objects.create(
            invoice=self.invoice, amount=Decimal("620.00"), currency="ZAR"
        )
        body = json.dumps({"event": "charge.success", "data": {"reference": payment.reference}})
        signature = hmac.new(b"sk_test_abc", body.encode(), hashlib.sha512).hexdigest()

        with mock.patch("core.paystack.verify") as verify:
            verify.return_value = {
                "status": True,
                "data": {"status": "success", "amount": 62000, "currency": "ZAR"},
            }
            response = self.client.post(
                reverse("paystack-webhook"),
                body,
                content_type="application/json",
                HTTP_X_PAYSTACK_SIGNATURE=signature,
            )

        self.assertEqual(response.status_code, 200)
        verify.assert_called_once_with(payment.reference)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.PAID)

    @override_settings(
        PAYSTACK_SECRET_KEY="sk_test_abc", PORTAL_URL="https://portal.example.com"
    )
    def test_the_customer_comes_back_through_the_view_that_confirms(self):
        """The whole payment depends on this one URL.

        If the callback points at the portal instead, the customer sees their
        page, nothing asks Paystack what happened, and the invoice stays unpaid
        until a webhook arrives. A webhook needs a public address with a real
        certificate, which a new deployment may not have, so this is what makes
        payments work at all.
        """
        self.client.force_login(self.user)
        with mock.patch("core.paystack.initialize") as initialize:
            initialize.return_value = {
                "status": True,
                "data": {"authorization_url": "https://paystack.test/x", "access_code": "a"},
            }
            response = self.client.post(reverse("invoice-pay", args=[self.invoice.pk]))

        self.assertEqual(response.status_code, 200)
        callback = initialize.call_args[0][1]
        self.assertEqual(
            callback, "https://portal.example.com/api/billing/paystack/return/"
        )

    @override_settings(
        PAYSTACK_SECRET_KEY="sk_test_abc", PORTAL_URL="https://portal.example.com"
    )
    def test_returning_settles_and_says_so(self):
        payment = Payment.objects.create(
            invoice=self.invoice, amount=Decimal("620.00"), currency="ZAR"
        )
        with mock.patch("core.paystack.verify") as verify:
            verify.return_value = {
                "status": True,
                "data": {"status": "success", "amount": 62000, "currency": "ZAR"},
            }
            response = self.client.get(
                reverse("paystack-return"), {"reference": payment.reference}
            )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response["Location"],
            "https://portal.example.com/account/billing?payment=paid",
        )
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.PAID)

    @override_settings(
        PAYSTACK_SECRET_KEY="sk_test_abc", PORTAL_URL="https://portal.example.com"
    )
    def test_an_unconfirmed_return_says_pending_not_failed(self):
        """Telling someone it failed invites them to pay a second time."""
        payment = Payment.objects.create(
            invoice=self.invoice, amount=Decimal("620.00"), currency="ZAR"
        )
        with mock.patch("core.paystack.verify") as verify:
            verify.return_value = {"status": True, "data": {"status": "abandoned"}}
            response = self.client.get(
                reverse("paystack-return"), {"reference": payment.reference}
            )

        self.assertEqual(
            response["Location"],
            "https://portal.example.com/account/billing?payment=pending",
        )
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.DUE)

    @override_settings(
        PAYSTACK_SECRET_KEY="sk_test_abc", PORTAL_URL="https://portal.example.com"
    )
    def test_trxref_is_accepted_as_well_as_reference(self):
        """Paystack sends both names for the same value."""
        payment = Payment.objects.create(
            invoice=self.invoice, amount=Decimal("620.00"), currency="ZAR"
        )
        with mock.patch("core.paystack.verify") as verify:
            verify.return_value = {
                "status": True,
                "data": {"status": "success", "amount": 62000, "currency": "ZAR"},
            }
            self.client.get(reverse("paystack-return"), {"trxref": payment.reference})

        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.PAID)

    @override_settings(PAYSTACK_SECRET_KEY="sk_test_abc")
    def test_invoice_is_not_settled_when_the_amount_does_not_match(self):
        """Stops a part payment, or a tampered one, clearing the whole invoice."""
        from core.billing_views import settle

        payment = Payment.objects.create(
            invoice=self.invoice, amount=Decimal("620.00"), currency="ZAR"
        )
        with mock.patch("core.paystack.verify") as verify:
            verify.return_value = {
                "status": True,
                "data": {"status": "success", "amount": 100, "currency": "ZAR"},
            }
            self.assertFalse(settle(payment.reference))

        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.DUE)
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.FAILED)

    @override_settings(PAYSTACK_SECRET_KEY="sk_test_abc")
    def test_settling_twice_is_harmless(self):
        from core.billing_views import settle

        payment = Payment.objects.create(
            invoice=self.invoice, amount=Decimal("620.00"), currency="ZAR"
        )
        with mock.patch("core.paystack.verify") as verify:
            verify.return_value = {
                "status": True,
                "data": {"status": "success", "amount": 62000, "currency": "ZAR"},
            }
            self.assertTrue(settle(payment.reference))
            first_paid_at = Invoice.objects.get(pk=self.invoice.pk).paid_at
            self.assertTrue(settle(payment.reference))

        self.assertEqual(Invoice.objects.get(pk=self.invoice.pk).paid_at, first_paid_at)


class LoginCsrfTests(TestCase):
    """The login POST must be CSRF checked even though the caller is anonymous."""

    def setUp(self):
        User.objects.create_user("carol@example.com", "carol@example.com", "pw-carol-123")

    def test_login_without_a_csrf_token_is_rejected(self):
        client = Client(enforce_csrf_checks=True)
        response = client.post(
            reverse("auth-login"),
            {"email": "carol@example.com", "password": "pw-carol-123"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertNotIn("_auth_user_id", client.session)

    def test_login_with_a_csrf_token_succeeds(self):
        client = Client(enforce_csrf_checks=True)
        client.get(reverse("auth-csrf"))
        token = client.cookies["csrftoken"].value
        response = client.post(
            reverse("auth-login"),
            {"email": "carol@example.com", "password": "pw-carol-123"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("_auth_user_id", client.session)

    def test_wrong_password_is_rejected(self):
        client = Client(enforce_csrf_checks=True)
        client.get(reverse("auth-csrf"))
        token = client.cookies["csrftoken"].value
        response = client.post(
            reverse("auth-login"),
            {"email": "carol@example.com", "password": "wrong"},
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 401)
        self.assertNotIn("_auth_user_id", client.session)


class ReconcilePaymentsTests(APITestCase):
    """The safety net for a payment that succeeded but was never confirmed.

    The customer closes the tab on their bank's page, or the webhook cannot
    reach us because the site has no public certificate yet. Their money has
    still gone. Without this, the invoice sits unpaid and somebody has to
    notice by hand.
    """

    def setUp(self):
        from django.core.management import call_command

        self.call_command = call_command
        plan = Plan.objects.create(
            name="Plan", slug="plan-r", setup_fee=Decimal("500"), monthly_fee=Decimal("120")
        )
        user = User.objects.create_user("eve@example.com", "eve@example.com", "pw-eve-123")
        account = ClientAccount.objects.create(user=user, company_name="Eve Ltd", plan=plan)
        self.invoice = Invoice.objects.create(
            account=account,
            number="INV-R-1",
            amount=Decimal("170.00"),
            issued_on=date(2026, 11, 1),
            due_on=date(2026, 11, 8),
        )
        self.payment = Payment.objects.create(
            invoice=self.invoice, amount=Decimal("170.00"), currency="ZAR"
        )
        # Started a while ago, so it is past the grace period.
        Payment.objects.filter(pk=self.payment.pk).update(
            created_at=timezone.now() - timedelta(hours=2)
        )

    @override_settings(PAYSTACK_SECRET_KEY="sk_test_abc")
    def test_settles_a_payment_that_succeeded_without_us_hearing(self):
        with mock.patch("core.paystack.verify") as verify:
            verify.return_value = {
                "status": True,
                "data": {"status": "success", "amount": 17000, "currency": "ZAR"},
            }
            self.call_command("reconcile_payments", verbosity=0)

        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.PAID)

    @override_settings(PAYSTACK_SECRET_KEY="sk_test_abc")
    def test_leaves_an_abandoned_payment_alone(self):
        with mock.patch("core.paystack.verify") as verify:
            verify.return_value = {"status": True, "data": {"status": "abandoned"}}
            self.call_command("reconcile_payments", verbosity=0)

        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.DUE)

    @override_settings(PAYSTACK_SECRET_KEY="sk_test_abc")
    def test_does_not_disturb_someone_still_on_the_payment_page(self):
        Payment.objects.filter(pk=self.payment.pk).update(created_at=timezone.now())
        with mock.patch("core.paystack.verify") as verify:
            self.call_command("reconcile_payments", verbosity=0)
        verify.assert_not_called()

    @override_settings(PAYSTACK_SECRET_KEY="")
    def test_does_nothing_without_a_key(self):
        with mock.patch("core.paystack.verify") as verify:
            self.call_command("reconcile_payments", verbosity=0)
        verify.assert_not_called()
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.DUE)
