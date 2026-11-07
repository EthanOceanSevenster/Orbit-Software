"""Password generation for client logins."""

import secrets
import string

# Avoids 0/O and 1/l/I, which get misread when a password is typed from a phone
# screen or read aloud over the phone.
ALPHABET = "".join(c for c in string.ascii_letters + string.digits if c not in "0O1lI")


def generate_password(length: int = 16) -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(length))
