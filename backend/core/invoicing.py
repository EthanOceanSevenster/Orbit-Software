"""Raising invoices.

Hosting is billed for the month ahead, not the month just gone. That is the
whole reason an invoice carries a period: "R170" on a statement means nothing
a year later, and neither side can say what it bought.

One place does this so the admin action, the management command and anything
added later cannot drift apart on what a client owes or when.
"""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction

from .models import ClientAccount, Invoice, InvoiceLine


def month_after(day: date) -> date:
    """The same day of the following month, clamped to a short month.

    Kept for the domain renewal maths, which is a true anniversary.
    """
    year = day.year + (1 if day.month == 12 else 0)
    month = 1 if day.month == 12 else day.month + 1
    # 31 January plus a month is the last day of February, not the 3rd of March.
    for candidate in range(day.day, 27, -1):
        try:
            return date(year, month, candidate)
        except ValueError:
            continue
    return date(year, month, day.day)


def first_of_next_month(day: date) -> date:
    if day.month == 12:
        return date(day.year + 1, 1, 1)
    return date(day.year, day.month + 1, 1)


def last_day_of_month(day: date) -> date:
    return first_of_next_month(day) - timedelta(days=1)


def billing_period(after: date) -> tuple[date, date]:
    """The calendar month a client is billed for next.

    Everyone is billed on the first, for one whole calendar month. Anniversary
    dates mean thirty different billing days a month and a client who cannot
    answer "when do you take my money". The first is one answer for everybody.
    """
    start = after if after.day == 1 else first_of_next_month(after)
    return start, last_day_of_month(start)


def next_number(account: ClientAccount, issued_on: date) -> str:
    """A number nobody has used yet.

    Numbered per client per month with a counter, because the old
    `INV-{YYYYMM}-{account id}` collided the second time a client was billed
    in one month and the field is unique.
    """
    prefix = f"INV-{issued_on:%Y%m}-{account.pk:04d}"
    if not Invoice.objects.filter(number=prefix).exists():
        return prefix
    suffix = 2
    while Invoice.objects.filter(number=f"{prefix}-{suffix}").exists():
        suffix += 1
    return f"{prefix}-{suffix}"


def _lines_for(account: ClientAccount) -> list[tuple[str, Decimal]]:
    """What this client is charged for, itemised.

    An override replaces the breakdown outright, because that is what an
    override means: a figure agreed with the client that the plan no longer
    explains.
    """
    if account.monthly_fee_override is not None:
        return [("Monthly fee as agreed", account.monthly_fee_override)]

    lines: list[tuple[str, Decimal]] = []
    if account.plan:
        lines.append((f"{account.plan.name} hosting and support", account.plan.monthly_fee))
    for addon in account.addons.all():
        lines.append((addon.name, addon.monthly_fee))
    return lines


@transaction.atomic
def raise_next_invoice(
    account: ClientAccount,
    *,
    issued_on: date | None = None,
    advance_days: int = 7,
) -> Invoice | None:
    """Bill one client for their next period, or return None if there is nothing to bill.

    Returns None rather than raising, so a bulk run over every client skips
    the paused and the unpriced instead of stopping at the first one.
    """
    if account.status != ClientAccount.Status.ACTIVE:
        return None

    lines = _lines_for(account)
    total = sum((amount for _, amount in lines), Decimal("0.00"))
    if total <= 0:
        return None

    today = issued_on or date.today()

    # One calendar month, starting on the first. A date mid-month, whether
    # left over from an older scheme or typed by hand, rolls forward to the
    # next first rather than billing a part month nobody can reconcile.
    period_start, period_end = billing_period(account.next_payment_date or today)

    if Invoice.objects.filter(account=account, period_start=period_start).exists():
        # Already billed for this period. Raising a second one is how a client
        # ends up paying twice.
        return None

    # Billed in advance, so the invoice goes out before the month starts and
    # is due on the first day of it.
    due_on = period_start if settings.BILLING_IN_ADVANCE else period_end
    issue_date = min(today, due_on)

    invoice = Invoice.objects.create(
        account=account,
        number=next_number(account, issue_date),
        description=f"Hosting and support, {period_start:%B %Y}",
        amount=total,
        currency=account.currency,
        issued_on=issue_date,
        due_on=due_on,
        period_start=period_start,
        period_end=period_end,
        status=Invoice.Status.DUE,
    )

    for order, (description, amount) in enumerate(lines):
        InvoiceLine.objects.create(
            invoice=invoice,
            description=description,
            quantity=Decimal("1.00"),
            unit_amount=amount,
            sort_order=order,
        )

    # Move them along, so the next run bills the month after this one.
    account.next_payment_date = first_of_next_month(period_start)
    account.save(update_fields=["next_payment_date", "updated_at"])

    return invoice


def year_after(day: date) -> date:
    """The same day next year, with 29 February falling back to the 28th."""
    try:
        return day.replace(year=day.year + 1)
    except ValueError:
        return day.replace(year=day.year + 1, day=28)


@transaction.atomic
def raise_domain_renewal(
    account: ClientAccount, *, issued_on: date | None = None
) -> Invoice | None:
    """Bills one year of a client's domain, and moves the renewal date on.

    Charged once a year rather than folded into the monthly fee, so a client's
    monthly price never moves after they sign. The first year is already paid
    for inside the setup fee, which is why this only ever bills from the next
    renewal onward.
    """
    if account.status != ClientAccount.Status.ACTIVE:
        return None
    if not account.domain or not account.domain_renews_on:
        return None

    renews_on = account.domain_renews_on
    if Invoice.objects.filter(
        account=account, period_start=renews_on, description__startswith="Domain"
    ).exists():
        return None

    fee = account.domain_fee
    if fee is None:
        fee = settings.DOMAIN_RENEWAL_FEE
    if fee <= 0:
        return None

    today = issued_on or date.today()
    issue_date = min(today, renews_on)
    period_end = year_after(renews_on) - timedelta(days=1)

    invoice = Invoice.objects.create(
        account=account,
        number=next_number(account, issue_date),
        description=f"Domain renewal, {account.domain}",
        amount=fee,
        currency=account.currency,
        issued_on=issue_date,
        due_on=renews_on,
        period_start=renews_on,
        period_end=period_end,
        status=Invoice.Status.DUE,
    )
    InvoiceLine.objects.create(
        invoice=invoice,
        description=f"{account.domain} — one year, registered in your name",
        quantity=Decimal("1.00"),
        unit_amount=fee,
    )

    account.domain_renews_on = year_after(renews_on)
    account.save(update_fields=["domain_renews_on", "updated_at"])
    return invoice


def mark_overdue(today: date | None = None) -> int:
    """Flags invoices nobody paid by their due date.

    Nothing set this status before, so the overdue figure on the dashboard was
    permanently zero and a client who stopped paying looked the same as one
    who had not been billed yet.
    """
    today = today or date.today()
    return Invoice.objects.filter(
        status=Invoice.Status.DUE, due_on__lt=today
    ).update(status=Invoice.Status.OVERDUE)
