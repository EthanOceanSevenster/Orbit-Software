"""Raising invoices.

This decides what a client is charged and when, so the tests are mostly about
the ways it could charge somebody twice, charge them nothing, or quietly stop
charging them at all.
"""

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from .invoicing import (
    billing_period,
    first_of_next_month,
    mark_overdue,
    month_after,
    next_number,
    raise_next_invoice,
)
from .models import AddOn, ClientAccount, Invoice, Plan

User = get_user_model()


def make_account(**overrides) -> ClientAccount:
    plan = Plan.objects.create(
        name="Website Build & Hosting",
        slug=f"plan-{overrides.pop('slug', 'a')}",
        setup_fee=Decimal("500.00"),
        monthly_fee=Decimal("120.00"),
        features=["Hosting"],
    )
    email = overrides.pop("email", "client@example.com")
    user = User.objects.create_user(email, email, "pw-client-123")
    fields = {
        "user": user,
        "company_name": "Client Ltd",
        "plan": plan,
        "status": ClientAccount.Status.ACTIVE,
        "next_payment_date": date(2026, 12, 7),
    }
    fields.update(overrides)
    return ClientAccount.objects.create(**fields)


class BillingPeriodTests(TestCase):
    """Everyone is billed on the first, for one whole calendar month."""

    def test_a_date_on_the_first_bills_that_month(self):
        self.assertEqual(
            billing_period(date(2026, 12, 1)), (date(2026, 12, 1), date(2026, 12, 31))
        )

    def test_a_mid_month_date_rolls_to_the_next_first(self):
        """No part months: nobody can reconcile an invoice for 7 to 31 December."""
        self.assertEqual(
            billing_period(date(2026, 12, 7)), (date(2027, 1, 1), date(2027, 1, 31))
        )

    def test_february_ends_on_the_28th(self):
        self.assertEqual(
            billing_period(date(2027, 2, 1)), (date(2027, 2, 1), date(2027, 2, 28))
        )

    def test_december_rolls_into_january(self):
        self.assertEqual(first_of_next_month(date(2026, 12, 14)), date(2027, 1, 1))


class MonthArithmeticTests(TestCase):
    def test_a_month_later(self):
        self.assertEqual(month_after(date(2026, 1, 15)), date(2026, 2, 15))

    def test_rolls_into_the_next_year(self):
        self.assertEqual(month_after(date(2026, 12, 7)), date(2027, 1, 7))

    def test_the_31st_lands_on_the_last_day_of_a_short_month(self):
        """31 January plus a month is 28 February, not 3 March."""
        self.assertEqual(month_after(date(2027, 1, 31)), date(2027, 2, 28))


class InvoiceNumberTests(TestCase):
    def test_a_second_invoice_in_one_month_gets_its_own_number(self):
        """The old scheme collided here, and the field is unique."""
        account = make_account()
        first = next_number(account, date(2026, 11, 8))
        Invoice.objects.create(
            account=account,
            number=first,
            amount=Decimal("10.00"),
            issued_on=date(2026, 11, 8),
            due_on=date(2026, 11, 15),
        )
        second = next_number(account, date(2026, 11, 20))
        self.assertNotEqual(first, second)
        self.assertTrue(second.startswith(first))


class RaiseInvoiceTests(TestCase):
    def test_bills_the_period_ahead_and_itemises_it(self):
        account = make_account()
        addon = AddOn.objects.create(
            name="Business email address", slug="email-a", monthly_fee=Decimal("50.00")
        )
        account.addons.add(addon)

        account.next_payment_date = date(2026, 12, 1)
        account.save()

        invoice = raise_next_invoice(account, issued_on=date(2026, 11, 8))

        self.assertEqual(invoice.amount, Decimal("170.00"))
        self.assertEqual(invoice.period_start, date(2026, 12, 1))
        self.assertEqual(invoice.period_end, date(2026, 12, 31))
        # Issued before the month, due on the first of it. That is in advance.
        self.assertEqual(invoice.issued_on, date(2026, 11, 8))
        self.assertEqual(invoice.due_on, date(2026, 12, 1))

        amounts = sorted(line.amount for line in invoice.lines.all())
        self.assertEqual(amounts, [Decimal("50.00"), Decimal("120.00")])

    def test_moves_the_client_on_to_the_first_of_the_next_month(self):
        """Without this the same period is billed again every run."""
        account = make_account(next_payment_date=date(2026, 12, 1))
        raise_next_invoice(account, issued_on=date(2026, 11, 8))
        account.refresh_from_db()
        self.assertEqual(account.next_payment_date, date(2027, 1, 1))

    def test_a_mid_month_date_is_pulled_onto_the_first(self):
        """Left over from the old anniversary scheme, or typed by hand."""
        account = make_account(next_payment_date=date(2026, 12, 7))
        invoice = raise_next_invoice(account, issued_on=date(2026, 11, 8))
        self.assertEqual(invoice.period_start, date(2027, 1, 1))
        self.assertEqual(invoice.due_on, date(2027, 1, 1))

    def test_will_not_bill_the_same_period_twice(self):
        account = make_account(next_payment_date=date(2026, 12, 1))
        raise_next_invoice(account, issued_on=date(2026, 11, 8))
        account.next_payment_date = date(2026, 12, 1)  # as if a run repeated
        account.save()

        self.assertIsNone(raise_next_invoice(account, issued_on=date(2026, 11, 9)))
        self.assertEqual(Invoice.objects.count(), 1)

    def test_skips_a_paused_client(self):
        account = make_account(status=ClientAccount.Status.PAUSED)
        self.assertIsNone(raise_next_invoice(account))
        self.assertFalse(Invoice.objects.exists())

    def test_skips_a_client_with_nothing_to_charge(self):
        """Better no invoice than an invoice for zero."""
        account = make_account(plan=None)
        self.assertIsNone(raise_next_invoice(account))
        self.assertFalse(Invoice.objects.exists())

    def test_an_override_replaces_the_breakdown(self):
        """An override is a figure agreed with the client that the plan no longer explains."""
        account = make_account(monthly_fee_override=Decimal("95.00"))
        account.addons.add(
            AddOn.objects.create(name="Email", slug="email-b", monthly_fee=Decimal("50.00"))
        )

        invoice = raise_next_invoice(account, issued_on=date(2026, 11, 8))

        self.assertEqual(invoice.amount, Decimal("95.00"))
        self.assertEqual(invoice.lines.count(), 1)

    @override_settings(BILLING_IN_ADVANCE=False)
    def test_billing_in_arrears_is_due_at_the_end(self):
        account = make_account()
        invoice = raise_next_invoice(account, issued_on=date(2026, 11, 8))
        self.assertEqual(invoice.due_on, invoice.period_end)


class OverdueTests(TestCase):
    def test_marks_what_nobody_paid(self):
        """Nothing set this before, so the overdue figure was always zero."""
        account = make_account()
        today = date(2026, 12, 20)
        late = Invoice.objects.create(
            account=account,
            number="INV-LATE",
            amount=Decimal("170.00"),
            issued_on=today - timedelta(days=30),
            due_on=today - timedelta(days=1),
            status=Invoice.Status.DUE,
        )
        soon = Invoice.objects.create(
            account=account,
            number="INV-SOON",
            amount=Decimal("170.00"),
            issued_on=today,
            due_on=today + timedelta(days=7),
            status=Invoice.Status.DUE,
        )
        paid = Invoice.objects.create(
            account=account,
            number="INV-PAID",
            amount=Decimal("170.00"),
            issued_on=today - timedelta(days=60),
            due_on=today - timedelta(days=30),
            status=Invoice.Status.PAID,
        )

        self.assertEqual(mark_overdue(today), 1)

        self.assertEqual(Invoice.objects.get(pk=late.pk).status, Invoice.Status.OVERDUE)
        self.assertEqual(Invoice.objects.get(pk=soon.pk).status, Invoice.Status.DUE)
        self.assertEqual(Invoice.objects.get(pk=paid.pk).status, Invoice.Status.PAID)


class InvoiceDocumentTests(APITestCase):
    def setUp(self):
        self.account = make_account()
        self.account.contact_name = "Phakama Ndamase"
        self.account.address = "12 Loop Street\nCape Town"
        self.account.phone = "+27 82 000 0000"
        self.account.save()
        self.invoice = raise_next_invoice(self.account, issued_on=date(2026, 11, 8))

        other = make_account(slug="b", email="other@example.com")
        self.other_invoice = raise_next_invoice(other, issued_on=date(2026, 11, 8))

    def test_a_client_can_read_their_own_invoice_in_full(self):
        self.client.force_login(self.account.user)
        body = self.client.get(reverse("invoice-detail", args=[self.invoice.pk])).json()

        self.assertEqual(body["number"], self.invoice.number)
        self.assertEqual(body["billed_to"]["contact_name"], "Phakama Ndamase")
        self.assertIn("Loop Street", body["billed_to"]["address"])
        self.assertEqual(len(body["lines"]), 1)
        self.assertEqual(body["period_label"], "January 2027")

    def test_a_client_cannot_read_somebody_else_s_invoice(self):
        self.client.force_login(self.account.user)
        response = self.client.get(reverse("invoice-detail", args=[self.other_invoice.pk]))
        self.assertEqual(response.status_code, 404)

    def test_signing_in_is_required(self):
        response = self.client.get(reverse("invoice-detail", args=[self.invoice.pk]))
        self.assertIn(response.status_code, (401, 403))

    @override_settings(BANK_ACCOUNT_NUMBER="", BANK_NAME="")
    def test_bank_details_are_empty_rather_than_half_filled(self):
        """The page hides the whole block, so a client never sees a blank account number."""
        self.client.force_login(self.account.user)
        bank = self.client.get(
            reverse("invoice-detail", args=[self.invoice.pk])
        ).json()["issued_by"]["bank"]
        self.assertEqual(bank["account_number"], "")
        self.assertEqual(bank["name"], "")


class DomainRenewalTests(TestCase):
    """The first year is in the setup fee; every year after that is invoiced.

    Without this, a renewal is a cost absorbed quietly and forever, and nobody
    notices until there are forty of them.
    """

    def setUp(self):
        self.account = make_account()
        self.account.domain = "theirshop.co.za"
        self.account.domain_renews_on = date(2027, 11, 1)
        self.account.save()

    def test_bills_a_year_and_moves_the_date_on(self):
        from .invoicing import raise_domain_renewal

        invoice = raise_domain_renewal(self.account, issued_on=date(2027, 10, 1))

        self.assertEqual(invoice.amount, Decimal("200.00"))
        self.assertEqual(invoice.due_on, date(2027, 11, 1))
        self.assertEqual(invoice.period_start, date(2027, 11, 1))
        self.assertEqual(invoice.period_end, date(2028, 10, 31))
        self.assertIn("theirshop.co.za", invoice.description)

        self.account.refresh_from_db()
        self.assertEqual(self.account.domain_renews_on, date(2028, 11, 1))

    def test_does_not_bill_the_same_renewal_twice(self):
        from .invoicing import raise_domain_renewal

        raise_domain_renewal(self.account, issued_on=date(2027, 10, 1))
        self.account.domain_renews_on = date(2027, 11, 1)  # as if a run repeated
        self.account.save()

        self.assertIsNone(raise_domain_renewal(self.account, issued_on=date(2027, 10, 2)))
        self.assertEqual(Invoice.objects.filter(description__startswith="Domain").count(), 1)

    def test_a_client_without_a_domain_is_skipped(self):
        from .invoicing import raise_domain_renewal

        self.account.domain = ""
        self.account.save()
        self.assertIsNone(raise_domain_renewal(self.account))

    def test_a_per_client_fee_wins_over_the_default(self):
        from .invoicing import raise_domain_renewal

        self.account.domain_fee = Decimal("350.00")
        self.account.save()
        invoice = raise_domain_renewal(self.account, issued_on=date(2027, 10, 1))
        self.assertEqual(invoice.amount, Decimal("350.00"))

    def test_the_monthly_price_is_untouched_by_a_renewal(self):
        """The whole point: a client's monthly fee never moves after they sign."""
        from .invoicing import raise_domain_renewal

        before = self.account.monthly_total
        raise_domain_renewal(self.account, issued_on=date(2027, 10, 1))
        self.account.refresh_from_db()
        self.assertEqual(self.account.monthly_total, before)
