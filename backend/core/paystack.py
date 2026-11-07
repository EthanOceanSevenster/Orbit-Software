"""Paystack integration.

Two steps. We POST the order to `initialize`, Paystack returns an
authorization URL, and we send the customer there. Paystack then calls our
webhook and returns the customer to the portal.

The security model is deliberately simple compared with a checksum scheme:

* The webhook is signed with HMAC-SHA512 over the exact raw body, using the
  secret key. There are no field boundaries to shuffle, so a valid signature
  cannot be re-split into a different meaning.
* Even so, the webhook is never trusted on its own. Before an invoice is
  marked paid we call `verify` and read the amount, currency and status back
  from Paystack directly. A forged webhook therefore achieves nothing.
"""

import hashlib
import hmac
from decimal import Decimal

import requests
from django.conf import settings

API_ROOT = "https://api.paystack.co"
TIMEOUT = 20


def is_configured() -> bool:
    return bool(settings.PAYSTACK_SECRET_KEY)


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


def to_subunit(amount: Decimal) -> int:
    """Paystack takes the smallest unit of the currency. For ZAR that is cents."""
    return int((amount * 100).quantize(Decimal("1")))


def from_subunit(amount: int) -> Decimal:
    return (Decimal(amount) / 100).quantize(Decimal("0.01"))


def verify_signature(raw_body: bytes, signature: str) -> bool:
    """Check a webhook really came from Paystack.

    HMAC-SHA512 over the raw request body. The body must be the exact bytes
    received: re-serialising parsed JSON changes whitespace and key order and
    the signature stops matching.
    """
    if not is_configured() or not signature:
        return False
    expected = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode(),
        raw_body,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def initialize(payment, callback_url: str) -> dict:
    """Open a transaction and return where to send the customer's browser."""
    invoice = payment.invoice
    response = requests.post(
        f"{API_ROOT}/transaction/initialize",
        json={
            "email": invoice.account.user.email,
            "amount": to_subunit(payment.amount),
            "currency": payment.currency,
            "reference": payment.reference,
            "callback_url": callback_url,
            "metadata": {
                "invoice_number": invoice.number,
                "company": invoice.account.company_name,
            },
        },
        headers=_headers(),
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def verify(reference: str) -> dict:
    """Ask Paystack what actually happened. This is the authoritative answer."""
    response = requests.get(
        f"{API_ROOT}/transaction/verify/{reference}",
        headers=_headers(),
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    return response.json()
