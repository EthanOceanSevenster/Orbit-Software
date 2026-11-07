from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.management.base import BaseCommand

from core.signature import signature_html, signature_text

INTRO_HTML = """\
<p style="margin:0 0 14px 0;">Hello,</p>
<p style="margin:0 0 14px 0;">
  This is a preview of the {company} email signature, sent as a real email so you
  can see exactly how it renders in an inbox.
</p>
<p style="margin:0 0 14px 0;">
  Check it on a phone as well as a desktop. If it looks right in both, paste it
  into Gmail under Settings, General, Signature.
</p>
<p style="margin:0 0 26px 0;">Thanks,</p>
"""

INTRO_TEXT = """\
Hello,

This is a preview of the {company} email signature, sent as a real email so you
can see exactly how it renders in an inbox.

Check it on a phone as well as a desktop. If it looks right in both, paste it
into Gmail under Settings, General, Signature.

Thanks,

"""

BODY_STYLE = (
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,"
    "Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0b1324;"
)


class Command(BaseCommand):
    help = "Email a preview of the company signature so you can see it in your inbox."

    def add_arguments(self, parser):
        parser.add_argument(
            "--to",
            dest="to",
            default=None,
            help="Recipient address (defaults to NOTIFY_EMAIL).",
        )
        parser.add_argument(
            "--subject",
            dest="subject",
            default=None,
            help="Subject line.",
        )

    def handle(self, *args, **options):
        recipient = options["to"] or getattr(settings, "NOTIFY_EMAIL", "")
        if not recipient:
            self.stderr.write(
                self.style.ERROR("No recipient. Set NOTIFY_EMAIL in .env or pass --to.")
            )
            return

        subject = options["subject"] or f"{settings.COMPANY_NAME} email signature"
        backend = settings.MAILERS["default"]["BACKEND"]
        using_smtp = backend.endswith("smtp.EmailBackend")

        try:
            sig_html = signature_html()
            sig_text = signature_text()
        except OSError as exc:
            self.stderr.write(self.style.ERROR(f"Could not read the signature files: {exc}"))
            self.stderr.write(f"Looked in: {settings.SIGNATURE_DIR}")
            return

        intro = {"company": settings.COMPANY_NAME}
        html = f'<div style="{BODY_STYLE}">{INTRO_HTML.format(**intro)}{sig_html}</div>'
        text = INTRO_TEXT.format(**intro) + sig_text

        verbosity = options.get("verbosity", 1)
        if verbosity:
            self.stdout.write(f"Backend: {backend}")
            self.stdout.write(f"From:    {settings.DEFAULT_FROM_EMAIL}")
            self.stdout.write(f"To:      {recipient}")

        message = EmailMultiAlternatives(
            subject=subject,
            body=text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
        )
        message.attach_alternative(html, "text/html")

        try:
            message.send()
        except Exception as exc:  # noqa: BLE001 - report the real cause to the operator
            self.stderr.write(self.style.ERROR(f"\nSending failed: {exc}"))
            return

        if not verbosity:
            return
        if using_smtp:
            self.stdout.write(self.style.SUCCESS(f"\nSent. Check the inbox for {recipient}."))
        else:
            self.stdout.write(
                self.style.WARNING(
                    "\nEMAIL_HOST_PASSWORD is empty, so this was printed to the console "
                    "rather than sent."
                )
            )
