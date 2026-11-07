from decimal import Decimal
from unittest import mock

from django.conf import settings
from django.core import mail
from django.core.management import call_command
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import AddOn, ContactInquiry, Plan, ProjectRequest
from .signature import signature_html, signature_text


class PlanApiTests(APITestCase):
    def setUp(self):
        self.plan = Plan.objects.create(
            name="Website Build & Hosting",
            slug="website-build-and-hosting",
            setup_fee=Decimal("500.00"),
            monthly_fee=Decimal("120.00"),
            features=["Hosting", "Support"],
            is_featured=True,
        )
        Plan.objects.create(
            name="Hidden",
            slug="hidden",
            setup_fee=Decimal("1.00"),
            monthly_fee=Decimal("1.00"),
            is_active=False,
        )

    def test_lists_only_active_plans(self):
        response = self.client.get(reverse("plan-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [item["slug"] for item in response.json()]
        self.assertEqual(slugs, ["website-build-and-hosting"])

    def test_plan_detail_exposes_pricing(self):
        response = self.client.get(reverse("plan-detail", args=[self.plan.slug]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertEqual(body["setup_fee"], "500.00")
        self.assertEqual(body["monthly_fee"], "120.00")
        self.assertEqual(body["currency"], "ZAR")


class ContactApiTests(APITestCase):
    def test_creates_inquiry(self):
        payload = {
            "name": "Jane",
            "email": "jane@example.com",
            "company": "Jane Ltd",
            "message": "I need a website.",
        }
        response = self.client.post(reverse("contact-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactInquiry.objects.count(), 1)

    def test_rejects_missing_fields(self):
        response = self.client.post(reverse("contact-create"), {"name": "X"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.json())
        self.assertIn("message", response.json())


class ProjectRequestApiTests(APITestCase):
    def setUp(self):
        self.plan = Plan.objects.create(
            name="Website Build & Hosting",
            slug="website-build-and-hosting",
            setup_fee=Decimal("500.00"),
            monthly_fee=Decimal("120.00"),
        )

    def test_creates_request_linked_to_plan(self):
        payload = {
            "name": "Sam",
            "email": "sam@example.com",
            "plan": self.plan.slug,
            "website_type": "business",
            "details": "Small plumbing business.",
        }
        response = self.client.post(reverse("project-request-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        req = ProjectRequest.objects.get()
        self.assertEqual(req.plan, self.plan)
        self.assertEqual(req.status, ProjectRequest.Status.NEW)

    def test_unknown_plan_is_rejected(self):
        payload = {"name": "Sam", "email": "sam@example.com", "plan": "nope"}
        response = self.client.post(reverse("project-request-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EmailNotificationTests(APITestCase):
    """The From line must carry the company name, and Reply-To the customer."""

    def setUp(self):
        self.plan = Plan.objects.create(
            name="Website Build & Hosting",
            slug="website-build-and-hosting",
            setup_fee=Decimal("500.00"),
            monthly_fee=Decimal("120.00"),
        )

    @override_settings(NOTIFY_EMAIL="team@example.com")
    def test_contact_notification_is_branded_and_replies_to_sender(self):
        payload = {
            "name": "Jane",
            "email": "jane@example.com",
            "message": "I need a website.",
        }
        response = self.client.post(reverse("contact-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertEqual(sent.to, ["team@example.com"])
        self.assertIn(settings.COMPANY_NAME, sent.from_email)
        self.assertTrue(sent.from_email.startswith(f"{settings.COMPANY_NAME} <"))
        self.assertEqual(sent.reply_to, ["jane@example.com"])

    @override_settings(NOTIFY_EMAIL="team@example.com")
    def test_project_request_notification_replies_to_sender(self):
        payload = {
            "name": "Sam",
            "email": "sam@example.com",
            "plan": self.plan.slug,
            "website_type": "business",
        }
        response = self.client.post(reverse("project-request-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].reply_to, ["sam@example.com"])

    @override_settings(NOTIFY_EMAIL="")
    def test_no_email_sent_when_notify_address_is_blank(self):
        payload = {"name": "Jane", "email": "jane@example.com", "message": "Hi."}
        response = self.client.post(reverse("contact-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(NOTIFY_EMAIL="team@example.com")
    def test_submission_still_succeeds_when_mail_fails(self):
        payload = {"name": "Jane", "email": "jane@example.com", "message": "Hi."}
        with mock.patch(
            "core.notifications.EmailMessage.send", side_effect=OSError("smtp down")
        ):
            response = self.client.post(reverse("contact-create"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactInquiry.objects.count(), 1)


class SignatureTests(APITestCase):
    """The signature is company-only and never shows a dead mailbox."""

    def test_no_placeholder_tokens_survive(self):
        for body in (signature_html(), signature_text()):
            self.assertNotRegex(body, r"__[A-Z]+__")

    def test_services_strip_is_not_corrupted_by_substitution(self):
        """Regression: a bare "WEBSITE" token once rewrote "WEBSITE DESIGN"."""
        for body in (signature_html(), signature_text()):
            self.assertIn("WEBSITE DESIGN", body)

    def test_html_starts_at_the_markup(self):
        """The template's explanatory comment is documentation, not email content."""
        html = signature_html()
        self.assertTrue(html.lstrip().startswith("<table"))
        self.assertNotIn("Replace:", html)
        self.assertNotIn("IF_EMAIL", html)

    @override_settings(PUBLIC_EMAIL="")
    def test_email_row_is_dropped_when_no_public_address(self):
        for body in (signature_html(), signature_text()):
            self.assertNotIn("mailto", body)
            self.assertNotIn("IF_EMAIL", body)

    @override_settings(PUBLIC_EMAIL="hello@example.com")
    def test_email_row_appears_when_an_address_is_set(self):
        html = signature_html()
        self.assertIn("mailto:hello@example.com", html)
        self.assertNotIn("IF_EMAIL", html)
        self.assertIn("hello@example.com", signature_text())

    def test_signature_carries_no_job_title_or_phone(self):
        """Guards the owner's privacy: the business must not be traceable to a person."""
        titles = ("founder", "owner", "director", "ceo", "cto", "manager")
        for body in (signature_html(), signature_text()):
            lowered = body.lower()
            self.assertNotIn("tel:", lowered)
            for title in titles:
                self.assertNotIn(title, lowered)

    def test_signature_contains_no_forbidden_terms(self):
        """Terms such as a surname come from SIGNATURE_FORBIDDEN_TERMS in .env, so
        the repository never publishes the very words this rule exists to hide."""
        terms = getattr(settings, "SIGNATURE_FORBIDDEN_TERMS", [])
        if not terms:
            self.skipTest("SIGNATURE_FORBIDDEN_TERMS is not configured")
        for body in (signature_html(), signature_text()):
            lowered = body.lower()
            for term in terms:
                self.assertNotIn(term.lower(), lowered)

    def test_signature_contains_no_images(self):
        # Images break when a mail client blocks remote content.
        html = signature_html()
        self.assertNotIn("<img", html)
        self.assertNotIn("data:image", html)

    @override_settings(COMPANY_WEBSITE="https://example.com/")
    def test_website_protocol_is_not_doubled(self):
        html = signature_html()
        self.assertNotIn("https://https://", html)
        self.assertIn('href="https://example.com"', html)

    @override_settings(NOTIFY_EMAIL="team@example.com")
    def test_send_signature_command_sends_html_and_text(self):
        call_command("send_signature", verbosity=0)
        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertEqual(sent.to, ["team@example.com"])
        self.assertTrue(sent.from_email.startswith(f"{settings.COMPANY_NAME} <"))
        self.assertEqual(len(sent.alternatives), 1)
        html_body, mimetype = sent.alternatives[0]
        self.assertEqual(mimetype, "text/html")
        self.assertIn(settings.COMPANY_WEBSITE, html_body)


class AddOnApiTests(APITestCase):
    def setUp(self):
        AddOn.objects.create(
            name="Business email address",
            slug="business-email",
            monthly_fee=Decimal("50.00"),
        )
        AddOn.objects.create(
            name="Hidden extra", slug="hidden-extra", monthly_fee=Decimal("9.00"), is_active=False
        )

    def test_lists_only_active_addons(self):
        response = self.client.get(reverse("addon-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertEqual([item["slug"] for item in body], ["business-email"])
        self.assertEqual(body[0]["monthly_fee"], "50.00")
