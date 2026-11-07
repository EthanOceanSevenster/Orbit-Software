"""The deploy-time admin login and the admin's client-creation form.

Render's free plan has no shell, so both of these are the only route to a
working login. They need to keep working.
"""

from decimal import Decimal
from unittest import mock

from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import RequestFactory, TestCase

from .admin import ClientAccountAdmin, ClientAccountCreationForm
from .models import ClientAccount, Plan

User = get_user_model()


class BootstrapAdminTests(TestCase):
    @mock.patch.dict(
        "os.environ",
        {"DJANGO_SUPERUSER_EMAIL": "boss@example.com", "DJANGO_SUPERUSER_PASSWORD": "s3cret-pw-9"},
    )
    def test_creates_the_superuser(self):
        call_command("bootstrap_admin", verbosity=0)
        user = User.objects.get(email="boss@example.com")
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.check_password("s3cret-pw-9"))

    @mock.patch.dict(
        "os.environ",
        {"DJANGO_SUPERUSER_EMAIL": "boss@example.com", "DJANGO_SUPERUSER_PASSWORD": "s3cret-pw-9"},
    )
    def test_running_twice_never_resets_the_password(self):
        """A deploy must not silently change a credential already in use."""
        call_command("bootstrap_admin", verbosity=0)
        user = User.objects.get(email="boss@example.com")
        user.set_password("changed-by-the-owner")
        user.save()

        call_command("bootstrap_admin", verbosity=0)

        user.refresh_from_db()
        self.assertTrue(user.check_password("changed-by-the-owner"))

    @mock.patch.dict("os.environ", {}, clear=True)
    def test_does_nothing_without_env_vars(self):
        call_command("bootstrap_admin", verbosity=0)
        self.assertEqual(User.objects.count(), 0)


class AdminClientCreationTests(TestCase):
    def setUp(self):
        self.plan = Plan.objects.create(
            name="Plan", slug="plan-x", setup_fee=Decimal("500"), monthly_fee=Decimal("120")
        )
        self.admin = ClientAccountAdmin(ClientAccount, AdminSite())
        self.request = RequestFactory().post("/admin/core/clientaccount/add/")
        self.request.user = User.objects.create_superuser(
            "root@example.com", "root@example.com", "root-pw-123"
        )
        # message_user needs the messages framework; the test only cares that
        # the user and account are created.
        self.admin.message_user = mock.Mock()

    def _form(self, **overrides):
        data = {
            "client_name": "Phakama Ndamase",
            "client_email": "phakama@example.com",
            "company_name": "Phakama Ndamase",
            "website_url": "",
            "plan": self.plan.pk,
            "extra_services": "[]",
            "monthly_fee_override": "",
            "next_payment_date": "",
            "status": "active",
            "notes": "",
        }
        data.update(overrides)
        return ClientAccountCreationForm(data=data)

    def test_creates_the_login_and_the_account_together(self):
        form = self._form()
        self.assertTrue(form.is_valid(), form.errors)
        account = form.save(commit=False)
        self.admin.save_model(self.request, account, form, change=False)

        user = User.objects.get(email="phakama@example.com")
        self.assertEqual(user.first_name, "Phakama")
        self.assertEqual(user.last_name, "Ndamase")
        self.assertFalse(user.is_staff, "a client must not get admin access")
        self.assertEqual(ClientAccount.objects.get().user, user)

    def test_shows_the_password_once(self):
        form = self._form()
        self.assertTrue(form.is_valid(), form.errors)
        self.admin.save_model(self.request, form.save(commit=False), form, change=False)

        message = self.admin.message_user.call_args[0][1]
        self.assertIn("phakama@example.com", message)
        password = message.split("Password: ")[1].split(" ")[0]
        self.assertGreaterEqual(len(password), 12)
        user = User.objects.get(email="phakama@example.com")
        self.assertTrue(user.check_password(password))

    def test_rejects_an_email_already_in_use(self):
        User.objects.create_user("taken@example.com", "taken@example.com", "pw-123456")
        form = self._form(client_email="taken@example.com")
        self.assertFalse(form.is_valid())
        self.assertIn("client_email", form.errors)
