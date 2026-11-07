"""Sending email over HTTPS instead of SMTP.

Render's free web services block outbound traffic to the SMTP ports, so Gmail
is unreachable from the live backend no matter what the credentials are. An
HTTPS API is not blocked, which is the whole reason this exists.

Set RESEND_API_KEY and this becomes the mail backend. Leave it unset and
nothing changes: SMTP is still used locally and on a paid instance.

The From address has to be one Resend will accept. With no domain verified
that is their onboarding sender, which can only write to the address the
Resend account was opened with. That suits a notification that goes to our own
inbox, and it is why DEFAULT_FROM_EMAIL is set separately rather than reused
from the SMTP user.
"""

import logging

import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)

API_URL = "https://api.resend.com/emails"


class ResendBackend(BaseEmailBackend):
    """Posts each message to Resend. Honours ``fail_silently``."""

    def __init__(self, fail_silently: bool = False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = getattr(settings, "RESEND_API_KEY", "")
        self.timeout = int(getattr(settings, "MAIL_TIMEOUT_SECONDS", 10))

    def send_messages(self, email_messages) -> int:
        if not email_messages:
            return 0
        if not self.api_key:
            if not self.fail_silently:
                raise ValueError("RESEND_API_KEY is not set.")
            logger.warning("RESEND_API_KEY is not set, so no mail was sent.")
            return 0

        sent = 0
        for message in email_messages:
            if self._send(message):
                sent += 1
        return sent

    def _send(self, message) -> bool:
        payload = {
            "from": message.from_email,
            "to": list(message.to),
            "subject": message.subject,
            "text": message.body,
        }
        if message.cc:
            payload["cc"] = list(message.cc)
        if message.bcc:
            payload["bcc"] = list(message.bcc)
        if message.reply_to:
            payload["reply_to"] = list(message.reply_to)

        try:
            response = requests.post(
                API_URL,
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=self.timeout,
            )
        except requests.RequestException:
            logger.exception("Could not reach Resend for: %s", message.subject)
            if not self.fail_silently:
                raise
            return False

        if response.status_code >= 400:
            # The body says which address or domain was refused, which is the
            # whole diagnosis. It carries no credential: the key is a header.
            logger.error(
                "Resend refused %s with %s: %s",
                message.subject,
                response.status_code,
                response.text[:500],
            )
            if not self.fail_silently:
                response.raise_for_status()
            return False

        return True
