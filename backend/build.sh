#!/usr/bin/env bash
# Render runs this on every deploy, before starting the service.
# Any non-zero exit fails the deploy, which is what we want: a broken
# migration should stop the release rather than go live half-applied.
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Collect the admin's CSS and JS so WhiteNoise can serve them.
python manage.py collectstatic --no-input

# Apply migrations against the managed Postgres instance.
python manage.py migrate --no-input

# Create or update the pricing plan and the optional add-on. Safe to re-run:
# it updates in place rather than duplicating.
python manage.py seed_plans

# Create the admin login from DJANGO_SUPERUSER_EMAIL / _PASSWORD. Render's free
# plan has no shell, so this is the only way to get a first login. It is a
# no-op once the account exists and never resets an existing password.
python manage.py bootstrap_admin

# Create the owner logins listed in seed_staff.json. Same rules: makes what
# is missing, never touches what is there, prints a generated password once.
python manage.py seed_staff

# Create any clients listed in SEED_CLIENTS that do not exist yet. Also a
# no-op on every deploy after the first, and it never edits a client who is
# already there: a deploy must never reset a paying customer's password or
# put them back on an old price.
python manage.py seed_clients
