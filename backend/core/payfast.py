"""
Payfast: a card saved once, then charged every month without the client.

Two different flows, and they sign their requests two different ways, which
is the single biggest source of "signature mismatch" in this integration:

  Checkout form  - fields in the order the documentation lists them.
  REST API       - fields in alphabetical order.

Payfast says so explicitly in both places. They are not interchangeable.

The card itself never reaches us. The client types it on Payfast's page, we
are handed a token, and that token is what we charge later. We could not leak
a card number if we tried, which is the only sane position for a business
that is not PCI certified.
"""

from __future__ import annotations

import hashlib
import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from urllib.parse import quote_plus

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

API_BASE = "https://api.payfast.co.za"
LIVE_PROCESS_URL = "https://www.payfast.co.za/eng/process"
SANDBOX_PROCESS_URL = "https://sandbox.payfast.co.za/eng/process"
UPDATE_CARD_URL = "https://www.payfast.co.za/eng/recurring/update"
SANDBOX_UPDATE_CARD_URL = "https://sandbox.payfast.co.za/eng/recurring/update"

TIMEOUT_SECONDS = 20


def is_configured() -> bool:
    """A merchant id and key are the minimum; the passphrase is required for
    anything involving a token, which is all of this."""
    return bool(
        getattr(settings, "PAYFAST_MERCHANT_ID", "")
        and getattr(settings, "PAYFAST_MERCHANT_KEY", "")
        and getattr(settings, "PAYFAST_PASSPHRASE", "")
    )


def in_sandbox() -> bool:
    return bool(getattr(settings, "PAYFAST_SANDBOX", False))


def process_url() -> str:
    return SANDBOX_PROCESS_URL if in_sandbox() else LIVE_PROCESS_URL


def update_card_url(token: str) -> str:
    base = SANDBOX_UPDATE_CARD_URL if in_sandbox() else UPDATE_CARD_URL
    return f"{base}/{token}"


def _encode(value: str) -> str:
    """Payfast wants spaces as '+' and the percent escapes in upper case.

    quote_plus gives lower-case escapes, which Payfast rejects, and this is
    not something you discover from the error message.
    """
    return _ESCAPE.sub(lambda match: match.group(0).upper(), quote_plus(str(value)))


_ESCAPE = re.compile(r"%[0-9a-fA-F]{2}")


def _signature(pairs: list[tuple[str, str]], passphrase: str, *, api: bool = False) -> str:
    """MD5 of the joined pairs, with the passphrase placed where Payfast wants it.

    And that place differs between the two flows, which is the detail that
    costs people an afternoon:

      checkout form - fields in documented order, passphrase appended last
      REST API      - passphrase sorted in alphabetically with everything else

    Blank values are left out entirely: including them changes the hash and
    Payfast does not include them on their side.
    """
    items = [(key, value) for key, value in pairs if str(value) != ""]
    if passphrase:
        if api:
            items = sorted(items + [("passphrase", passphrase)])
        else:
            items = items + [("passphrase", passphrase)]
    parts = [f"{key}={_encode(value)}" for key, value in items]
    return hashlib.md5("&".join(parts).encode("utf-8")).hexdigest()


# --------------------------------------------------------------------- #
# 1. Sending the client to Payfast to save a card                        #
# --------------------------------------------------------------------- #
@dataclass(frozen=True)
class Checkout:
    """Everything the browser needs to post itself to Payfast."""

    action: str
    fields: dict[str, str]


def checkout(
    *,
    payment_id: str,
    amount: Decimal,
    item_name: str,
    item_description: str,
    first_name: str,
    last_name: str,
    email: str,
    return_url: str,
    cancel_url: str,
    notify_url: str,
    tokenize: bool = True,
) -> Checkout:
    """Build the form that saves the card, and charges it the first time.

    `amount` may be 0.00, which Payfast accepts for tokenization: the client
    still enters the card and passes 3D Secure, but nothing is taken. That is
    the right flow for somebody signing up mid-month who owes nothing yet.

    Field order below is the documentation's order and must not be sorted.
    """
    fields: list[tuple[str, str]] = [
        ("merchant_id", settings.PAYFAST_MERCHANT_ID),
        ("merchant_key", settings.PAYFAST_MERCHANT_KEY),
        ("return_url", return_url),
        ("cancel_url", cancel_url),
        ("notify_url", notify_url),
        ("name_first", first_name),
        ("name_last", last_name),
        ("email_address", email),
        ("m_payment_id", payment_id),
        ("amount", f"{Decimal(amount):.2f}"),
        ("item_name", item_name[:100]),
        ("item_description", item_description[:255]),
    ]
    if tokenize:
        # 2 is a tokenization agreement: Payfast charges only when we say so.
        fields.append(("subscription_type", "2"))

    signature = _signature(fields, settings.PAYFAST_PASSPHRASE)
    data = {key: str(value) for key, value in fields}
    data["signature"] = signature
    return Checkout(action=process_url(), fields=data)


# --------------------------------------------------------------------- #
# 2. The notification Payfast sends us                                   #
# --------------------------------------------------------------------- #
def verify_itn(posted: dict[str, str]) -> bool:
    """Check the signature on an ITN, then ask Payfast whether it sent it.

    The signature alone is not enough. Anybody who learns the passphrase can
    forge one, and the whole point of the second step is that the answer
    comes from Payfast's servers rather than from the request in front of us.
    """
    if not is_configured():
        # An MD5 with an empty passphrase is computable by anyone, so a
        # missing passphrase has to fail closed rather than fail open.
        logger.warning("Payfast ITN refused: not configured")
        return False

    pairs = [(key, value) for key, value in posted.items() if key != "signature"]
    expected = _signature(pairs, settings.PAYFAST_PASSPHRASE)
    if expected != posted.get("signature", ""):
        logger.warning("Payfast ITN refused: signature mismatch")
        return False

    host = "sandbox.payfast.co.za" if in_sandbox() else "www.payfast.co.za"
    try:
        response = requests.post(
            f"https://{host}/eng/query/validate",
            data=posted,
            timeout=TIMEOUT_SECONDS,
        )
    except requests.RequestException:
        logger.exception("Payfast ITN validation request failed")
        return False

    valid = response.text.strip().split("\n")[0].strip() == "VALID"
    if not valid:
        logger.warning("Payfast ITN refused: Payfast did not confirm it")
    return valid


# --------------------------------------------------------------------- #
# 3. Charging a card we already have a token for                         #
# --------------------------------------------------------------------- #
@dataclass(frozen=True)
class ChargeResult:
    ok: bool
    message: str
    payfast_payment_id: str = ""


def charge(
    *,
    token: str,
    amount: Decimal,
    item_name: str,
    payment_id: str,
    item_description: str = "",
) -> ChargeResult:
    """Charge a saved card. Amount is in cents, as an integer, no decimals.

    This is the only call that moves money without the client present, so it
    returns a result rather than raising: a failed charge is an ordinary
    business event (an expired card, no funds) and the caller has to record
    it against the invoice either way.
    """
    if not is_configured():
        return ChargeResult(ok=False, message="Payfast is not configured")

    cents = int((Decimal(amount) * 100).quantize(Decimal("1")))
    timestamp = datetime.now(timezone.utc).astimezone().replace(microsecond=0).isoformat()

    headers = {
        "merchant-id": str(settings.PAYFAST_MERCHANT_ID),
        "version": "v1",
        "timestamp": timestamp,
    }
    body = {
        "amount": str(cents),
        "item_name": item_name[:100],
        "m_payment_id": payment_id[:100],
    }
    if item_description:
        body["item_description"] = item_description[:255]

    # The API signs alphabetically, over headers and body together. The
    # `testing` query parameter is deliberately not signed; Payfast says so.
    headers["signature"] = _signature(
        list({**headers, **body}.items()), settings.PAYFAST_PASSPHRASE, api=True
    )

    url = f"{API_BASE}/subscriptions/{token}/adhoc"
    params = {"testing": "true"} if in_sandbox() else None

    try:
        response = requests.post(
            url, headers=headers, data=body, params=params, timeout=TIMEOUT_SECONDS
        )
    except requests.RequestException as error:
        logger.exception("Payfast charge failed to send")
        return ChargeResult(ok=False, message=f"Could not reach Payfast: {error}")

    try:
        payload = response.json()
    except ValueError:
        logger.error("Payfast charge returned non-JSON: %s", response.text[:400])
        return ChargeResult(ok=False, message="Payfast returned something unreadable")

    data = payload.get("data") or {}
    if response.status_code == 200 and payload.get("status") == "success":
        return ChargeResult(
            ok=True,
            message=str(data.get("message", "Charged")),
            payfast_payment_id=str(data.get("pf_payment_id", "")),
        )

    message = str(data.get("message") or payload.get("data") or payload.get("status") or "Declined")
    logger.warning("Payfast charge declined: %s", message)
    return ChargeResult(ok=False, message=message)
