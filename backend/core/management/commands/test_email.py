from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Send a test notification email to NOTIFY_EMAIL to check the mail setup."

    def add_arguments(self, parser):
        parser.add_argument(
            "--to",
            dest="to",
            default=None,
            help="Override the recipient (defaults to NOTIFY_EMAIL).",
        )

    def handle(self, *args, **options):
        recipient = options["to"] or getattr(settings, "NOTIFY_EMAIL", "")
        if not recipient:
            self.stderr.write(
                self.style.ERROR("No recipient. Set NOTIFY_EMAIL in .env or pass --to.")
            )
            return

        backend = settings.MAILERS["default"]["BACKEND"]
        using_smtp = backend.endswith("smtp.EmailBackend")

        self.stdout.write(f"Backend:   {backend}")
        self.stdout.write(f"From:      {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"To:        {recipient}")

        if not using_smtp:
            self.stdout.write(
                self.style.WARNING(
                    "\nEMAIL_HOST_PASSWORD is empty, so the console backend is in use. "
                    "The message below was printed, not sent.\n"
                    "Add a Google App Password to backend/.env to send for real."
                )
            )

        try:
            sent = send_mail(
                "Orbit Software test email",
                "If you are reading this in your inbox, email notifications are working.",
                settings.DEFAULT_FROM_EMAIL,
                [recipient],
            )
        except Exception as exc:  # noqa: BLE001 - report the real cause to the operator
            self.stderr.write(self.style.ERROR(f"\nSending failed: {exc}"))
            self.stderr.write(
                "Check that EMAIL_HOST_USER is your full Gmail address and that "
                "EMAIL_HOST_PASSWORD is a Google App Password, not your login password."
            )
            return

        if sent and using_smtp:
            self.stdout.write(self.style.SUCCESS(f"\nSent. Check the inbox for {recipient}."))
        elif sent:
            self.stdout.write(self.style.SUCCESS("\nConsole backend printed the message above."))
