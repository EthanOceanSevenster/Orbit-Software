"""Telling us about a new form submission, without making the visitor wait.

Sending is deliberately off the request's critical path. The submission is
already saved by the time this runs, so the visitor's answer does not depend on
whether a mail server is reachable. That matters here: Render's free web
services block outbound SMTP, so on the live site the connection does not fail,
it hangs, and a synchronous send turned every contact form submission into a
thirty-second wait and then a 500.
"""

import logging
import threading

from django.conf import settings
from django.core.mail import EmailMessage, get_connection
from django.core.mail.backends.locmem import EmailBackend as LocmemBackend
from django.db import close_old_connections

logger = logging.getLogger(__name__)


def _send_now(subject: str, body: str, recipient: str, reply_addresses: list[str]) -> None:
    """Does the sending. Never raises: there is no caller left to tell."""
    try:
        sent = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
            reply_to=reply_addresses or None,
        ).send()
    except Exception:  # noqa: BLE001 - deliberately broad, see module docstring
        logger.exception("Failed to send notification email: %s", subject)
        return
    finally:
        # A thread of our own gets its own database connections. Django only
        # tidies those up per request, so this thread has to do it itself.
        close_old_connections()

    if sent:
        logger.info("Notification email sent to %s: %s", recipient, subject)
    else:
        logger.warning("Mail backend accepted nothing for: %s", subject)


def _sends_instantly() -> bool:
    """True when sending cannot block, so there is nothing to move off-thread.

    The in-memory backend is what the test suite uses. Keeping it inline means
    a test can assert on ``mail.outbox`` straight after the request instead of
    racing a thread that may not have run yet.
    """
    try:
        return isinstance(get_connection(), LocmemBackend)
    except Exception:  # noqa: BLE001 - a broken mail config is not our problem here
        return False


def notify_new_submission(subject: str, body: str, reply_to: str | None = None) -> None:
    """Email the team about a new form submission.

    The message is sent from the company name (see DEFAULT_FROM_EMAIL) rather
    than a bare address. ``reply_to`` is the visitor's address, so hitting
    Reply on the notification answers the customer directly.

    Returns immediately. Whether the mail actually left is recorded in the log,
    not in the response: the submission is in the database either way, and that
    is what we work from.
    """
    recipient = getattr(settings, "NOTIFY_EMAIL", "")
    if not recipient:
        logger.warning("NOTIFY_EMAIL is empty, so no notification was sent for: %s", subject)
        return

    reply_addresses = [address for address in [reply_to] if address]
    args = (subject, body, recipient, reply_addresses)

    if _sends_instantly():
        _send_now(*args)
        return

    # Daemon, so a shutting-down worker is never held open by a mail server
    # that has stopped answering. The SMTP timeout in settings caps how long
    # this thread can sit there in the meantime.
    threading.Thread(
        target=_send_now, args=args, name="notify-new-submission", daemon=True
    ).start()
