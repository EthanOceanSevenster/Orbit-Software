import logging

from django.conf import settings
from django.core.mail import EmailMessage

logger = logging.getLogger(__name__)


def notify_new_submission(subject: str, body: str, reply_to: str | None = None) -> None:
    """Email the team about a new form submission.

    The message is sent from the company name (see DEFAULT_FROM_EMAIL) rather
    than a bare address. ``reply_to`` is the visitor's address, so hitting
    Reply on the notification answers the customer directly.

    Never raises: a mail failure must not turn into a failed API request for
    the visitor who just submitted the form.
    """
    recipient = getattr(settings, "NOTIFY_EMAIL", "")
    if not recipient:
        logger.warning("NOTIFY_EMAIL is empty, so no notification was sent for: %s", subject)
        return

    reply_addresses = [address for address in [reply_to] if address]

    try:
        sent = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
            reply_to=reply_addresses or None,
        ).send()
    except Exception:  # noqa: BLE001 - deliberately broad, see docstring
        logger.exception("Failed to send notification email: %s", subject)
        return

    if sent:
        logger.info("Notification email sent to %s: %s", recipient, subject)
    else:
        logger.warning("Mail backend accepted nothing for: %s", subject)
