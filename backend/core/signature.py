"""Load the company email signature.

The markup lives in brand/signature/ so Gmail, the website and Django all use
one source. This module only fills in the placeholders.

The signature is deliberately company-only. It carries no personal name, job
title or phone number, because the owner does not want the business traced back
to them personally. Keep it that way: add fields here only if they are about the
company, not a person.
"""

import re

from django.conf import settings

# The email row is wrapped in these markers so it can be dropped entirely when
# no public mailbox exists yet. Showing an address that bounces is worse than
# showing none.
HTML_EMAIL_BLOCK = re.compile(r"<!--IF_EMAIL-->.*?<!--END_EMAIL-->\n?", re.S)
TEXT_EMAIL_BLOCK = re.compile(r"\[IF_EMAIL\].*?\[END_EMAIL\]", re.S)

# The HTML file opens with a comment explaining the template. That is
# documentation for whoever edits it, not something to paste into an email.
LEADING_COMMENT = re.compile(r"\A\s*<!--.*?-->\s*", re.S)


def _replacements() -> dict[str, str]:
    website = settings.COMPANY_WEBSITE.replace("https://", "").replace("http://", "").rstrip("/")
    # Tokens are wrapped in double underscores so they can never collide with
    # real copy. Replacing a bare "WEBSITE" once corrupted "WEBSITE DESIGN" in
    # the services strip.
    return {
        "__WEBSITE__": website,
        "__LOCATION__": settings.COMPANY_LOCATION,
        "__EMAIL__": settings.PUBLIC_EMAIL,
    }


def _fill(template: str, *, html: bool) -> str:
    if html:
        template = LEADING_COMMENT.sub("", template)

    if settings.PUBLIC_EMAIL:
        # Keep the row, just strip the markers.
        template = (
            template.replace("<!--IF_EMAIL-->\n", "").replace("<!--END_EMAIL-->\n", "")
            if html
            else template.replace("[IF_EMAIL]", "").replace("[END_EMAIL]", "")
        )
    else:
        pattern = HTML_EMAIL_BLOCK if html else TEXT_EMAIL_BLOCK
        template = pattern.sub("", template)

    for placeholder, value in _replacements().items():
        template = template.replace(placeholder, value)
    return template


def signature_html() -> str:
    """The signature as HTML, ready to append to an email body."""
    return _fill(
        (settings.SIGNATURE_DIR / "signature.html").read_text(encoding="utf-8"), html=True
    )


def signature_text() -> str:
    """The signature as plain text, for the text/plain part of an email."""
    return _fill(
        (settings.SIGNATURE_DIR / "signature.txt").read_text(encoding="utf-8"), html=False
    )
