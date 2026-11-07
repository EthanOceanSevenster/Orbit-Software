"""
Django settings for the software company website backend.

Environment variables are read from backend/.env (see .env.example).
"""

import os
from email.utils import formataddr
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

DEBUG = env_bool("DJANGO_DEBUG", True)

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "")
if not SECRET_KEY:
    if not DEBUG:
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY must be set when DEBUG is off. Generate one with: "
            "python -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\""
        )
    # Development only. The check above stops this reaching production.
    SECRET_KEY = "django-insecure-dev-only-not-used-in-production"

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

# Render publishes the service's public hostname. Adding it automatically means
# a deploy works without hand-editing DJANGO_ALLOWED_HOSTS for every new URL.
RENDER_HOSTNAME = os.getenv("RENDER_EXTERNAL_HOSTNAME", "")
if RENDER_HOSTNAME and RENDER_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_HOSTNAME)

# On Render's private network a service is addressed by its own name, which is
# how the Next.js server reaches this API. Without it, every proxied request
# would be rejected with a DisallowedHost error.
RENDER_SERVICE_NAME = os.getenv("RENDER_SERVICE_NAME", "")
if RENDER_SERVICE_NAME and RENDER_SERVICE_NAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_SERVICE_NAME)

# Render terminates TLS at its proxy and forwards plain HTTP, so Django has to
# read the forwarded header to know the original request was secure. Without
# this, admin login redirects in a loop behind HTTPS.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Admin login posts a form, so its origin must be trusted. Scheme is required.
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")
if RENDER_HOSTNAME:
    CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_HOSTNAME}")

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # Render serves everything over HTTPS. The redirect is safe here because
    # SECURE_PROXY_SSL_HEADER above lets Django recognise already-secure
    # requests, so this cannot loop.
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)

    # Tell browsers to use HTTPS for this host from now on. Start at one hour.
    # Raise it to 31536000 once you are confident, because browsers remember
    # the longest value they have seen and it cannot easily be taken back.
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "3600"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", False)
    SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", False)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "corsheaders",
    # Local
    "core",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # Must come directly after SecurityMiddleware.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
# SQLite locally. In production DATABASE_URL points at the managed Postgres
# instance, which Render injects from the database defined in render.yaml.

if os.getenv("DATABASE_URL"):
    import dj_database_url

    DATABASES = {
        "default": dj_database_url.config(
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=not DEBUG,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Internationalisation
# ---------------------------------------------------------------------------

LANGUAGE_CODE = "en-za"
TIME_ZONE = os.getenv("DJANGO_TIME_ZONE", "Africa/Johannesburg")
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static files
# ---------------------------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# WhiteNoise serves the admin's CSS and JS straight from the app, so no separate
# static host or CDN is needed.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
    },
}

# ---------------------------------------------------------------------------
# REST framework
# ---------------------------------------------------------------------------
# The public API is unauthenticated (plans are public, forms are submitted by
# anonymous visitors). Authentication classes are empty on purpose so a logged-in
# admin session in the same browser never triggers CSRF checks on the API.

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"]
    + (["rest_framework.renderers.BrowsableAPIRenderer"] if DEBUG else []),
    "DEFAULT_THROTTLE_RATES": {
        "form-submit": os.getenv("API_FORM_THROTTLE", "20/hour"),
    },
}

# ---------------------------------------------------------------------------
# CORS (the Next.js frontend talks to this API from a different origin)
# ---------------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)

# ---------------------------------------------------------------------------
# Email (console backend in development; set SMTP values in .env for production)
# ---------------------------------------------------------------------------

NOTIFY_EMAIL = os.getenv("NOTIFY_EMAIL", "")

# The name recipients see in the "From" line of every email we send.
COMPANY_NAME = os.getenv("COMPANY_NAME", "Orbit Software")

# Gmail rejects a From address that is not the authenticated account, so the
# address always stays the SMTP user. Only the display name is ours to choose,
# which is what makes mail arrive as "Orbit Software" rather than a bare address.
_from_address = os.getenv("DEFAULT_FROM_EMAIL") or os.getenv(
    "EMAIL_HOST_USER", "no-reply@localhost"
)
DEFAULT_FROM_EMAIL = (
    _from_address
    if "<" in _from_address
    else formataddr((COMPANY_NAME, _from_address))
)

# Where replies go when someone answers one of our emails. Falls back to the
# From address when unset.
REPLY_TO_EMAIL = os.getenv("REPLY_TO_EMAIL", "")

# ---------------------------------------------------------------------------
# Public identity
# ---------------------------------------------------------------------------
# PUBLIC_EMAIL is shown on the website and in the signature. NOTIFY_EMAIL above
# is private and only receives form submissions. They are separate on purpose:
# the owner does not want the business traced back to them personally, so the
# public address must not contain a personal name.

# Empty until a real company mailbox exists. While it is blank the signature
# drops its email row and the website routes enquiries through the form.
PUBLIC_EMAIL = os.getenv("PUBLIC_EMAIL", "")
COMPANY_WEBSITE = os.getenv("COMPANY_WEBSITE", "orbitsoftware.co.za")
COMPANY_LOCATION = os.getenv("COMPANY_LOCATION", "South Africa")

# Words that must never appear in the signature, as a comma-separated list, e.g.
# a surname. Kept in .env rather than in code so the repository never publishes
# the very thing the rule exists to hide. The privacy test reads this list.
SIGNATURE_FORBIDDEN_TERMS = env_list("SIGNATURE_FORBIDDEN_TERMS")

# The signature markup lives in brand/signature/ so the website, Gmail and the
# Django emails all use one source. It is company-only: no name, role or phone.
SIGNATURE_DIR = BASE_DIR.parent / "brand" / "signature"

# Only switch to SMTP once a password is present. Without it, Gmail refuses the
# login and every notification would fail, so we stay on the console backend.
if os.getenv("EMAIL_HOST") and os.getenv("EMAIL_HOST_PASSWORD"):
    MAILERS = {
        "default": {
            "BACKEND": "django.core.mail.backends.smtp.EmailBackend",
            "OPTIONS": {
                "host": os.getenv("EMAIL_HOST"),
                "port": int(os.getenv("EMAIL_PORT", "587")),
                "username": os.getenv("EMAIL_HOST_USER", ""),
                "password": os.getenv("EMAIL_HOST_PASSWORD", ""),
                "use_tls": env_bool("EMAIL_USE_TLS", True),
            },
        },
    }
else:
    MAILERS = {
        "default": {
            "BACKEND": "django.core.mail.backends.console.EmailBackend",
        },
    }


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
# Notification results go to the console so a missing email can be diagnosed
# from the server output rather than guessed at.

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "loggers": {
        "core": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}
