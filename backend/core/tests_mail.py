"""Notifications must never hold up, or sink, a visitor's submission.

Render's free web services block outbound SMTP, so on the live site the mail
connection hangs rather than failing. A synchronous send turned every contact
form submission into a thirty-second wait and then a 500, with the enquiry
saved but the visitor told it had failed. These cover the ways that is now
prevented.
"""

import threading
from unittest import mock

import requests
from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from .mail_backends import ResendBackend
from .models import ContactInquiry
from .notifications import notify_new_submission


class NotificationNeverBreaksTheRequestTests(APITestCase):
    def test_a_hanging_mail_server_does_not_hold_up_the_visitor(self):
        """The thread may still be waiting; the submission is already answered."""
        started = threading.Event()
        release = threading.Event()

        def block(*args, **kwargs):
            started.set()
            release.wait(timeout=10)
            return 1

        # Pretend the live mail route is a blocking one rather than locmem.
        with mock.patch("core.notifications._sends_instantly", return_value=False):
            with mock.patch("django.core.mail.EmailMessage.send", side_effect=block):
                try:
                    response = self.client.post(
                        reverse("contact-create"),
                        {
                            "name": "Slow Mail",
                            "email": "slow@example.com",
                            "message": "Does this hang?",
                        },
                        format="json",
                    )
                    self.assertEqual(response.status_code, 201)
                    self.assertTrue(
                        started.wait(timeout=5), "the send should have been attempted"
                    )
                finally:
                    release.set()

        self.assertEqual(ContactInquiry.objects.count(), 1)

    def test_a_mail_failure_does_not_fail_the_submission(self):
        with mock.patch(
            "django.core.mail.EmailMessage.send", side_effect=OSError("network is unreachable")
        ):
            response = self.client.post(
                reverse("contact-create"),
                {"name": "No Mail", "email": "nomail@example.com", "message": "Hello."},
                format="json",
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ContactInquiry.objects.count(), 1)

    def test_sending_stays_inline_for_the_in_memory_backend(self):
        """Otherwise every existing test would be racing a thread."""
        notify_new_submission(subject="Inline check", body="Body.")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Inline check")

    @override_settings(NOTIFY_EMAIL="")
    def test_no_recipient_means_no_attempt(self):
        with mock.patch("django.core.mail.EmailMessage.send") as send:
            notify_new_submission(subject="Nowhere to go", body="Body.")
        send.assert_not_called()


class ResendBackendTests(TestCase):
    """The HTTPS route that works where SMTP is blocked."""

    def setUp(self):
        self.message = mail.EmailMessage(
            subject="New contact inquiry",
            body="Someone got in touch.",
            from_email="Orbit Software <onboarding@resend.dev>",
            to=["owner@example.com"],
            reply_to=["visitor@example.com"],
        )

    @override_settings(RESEND_API_KEY="re_test_key")
    def test_posts_the_message_over_https(self):
        backend = ResendBackend()
        with mock.patch("core.mail_backends.requests.post") as post:
            post.return_value = mock.Mock(status_code=200)
            self.assertEqual(backend.send_messages([self.message]), 1)

        args, kwargs = post.call_args
        self.assertEqual(args[0], "https://api.resend.com/emails")
        self.assertEqual(kwargs["json"]["to"], ["owner@example.com"])
        self.assertEqual(kwargs["json"]["reply_to"], ["visitor@example.com"])
        self.assertEqual(kwargs["json"]["from"], "Orbit Software <onboarding@resend.dev>")
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer re_test_key")
        self.assertTrue(kwargs["timeout"] > 0, "a request with no timeout can hang")

    @override_settings(RESEND_API_KEY="re_test_key")
    def test_a_refused_message_is_reported_not_counted(self):
        backend = ResendBackend(fail_silently=True)
        with mock.patch("core.mail_backends.requests.post") as post:
            post.return_value = mock.Mock(status_code=422, text="domain not verified")
            self.assertEqual(backend.send_messages([self.message]), 0)

    @override_settings(RESEND_API_KEY="re_test_key")
    def test_an_unreachable_api_is_swallowed_when_asked_to_be(self):
        backend = ResendBackend(fail_silently=True)
        with mock.patch(
            "core.mail_backends.requests.post",
            side_effect=requests.RequestException("no route"),
        ):
            self.assertEqual(backend.send_messages([self.message]), 0)

    @override_settings(RESEND_API_KEY="")
    def test_no_key_sends_nothing_rather_than_half_configured_mail(self):
        backend = ResendBackend(fail_silently=True)
        with mock.patch("core.mail_backends.requests.post") as post:
            self.assertEqual(backend.send_messages([self.message]), 0)
        post.assert_not_called()
