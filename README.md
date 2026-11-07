# Software Company Website

Marketing website for a software company that designs, builds and hosts websites for businesses.

- **Frontend:** Next.js 16 (App Router, TypeScript, Tailwind CSS 4) in `frontend/`
- **Backend:** Django 6 + Django REST Framework in `backend/`

Pricing:

| Item | Price |
| --- | --- |
| Website design and build | **R500** once-off |
| Managed hosting, SSL, backups and support | **R120** / month |
| Business email on your own domain (optional) | **R50** / month |

Hosting plus the business email comes to R170 a month. Prices are editable in the
Django admin under Plans and Add-ons; the values in `frontend/src/lib/site.ts`
are only the fallback used when the API is unreachable.

Card payments run through Paystack. They stay switched off until a secret key
is set, and the portal says so plainly rather than pretending to take money.

## Project layout

```
frontend/   Next.js site (pages, components, editable copy)
backend/    Django API + admin (plans, contact inquiries, project requests)
brand/      Email signature and brand assets
BRAND.md    Brand guide: colours, type, icons, layout, motion
```

## Brand

[BRAND.md](BRAND.md) is the reference for colours, typography, icons, spacing
and motion. New work follows it rather than inventing a new style.

The email signature lives in [brand/signature/](brand/signature/). Open
`preview.html` in a browser, fill in your details, press **Copy signature** and
paste it into Gmail. Install steps are on the page.

To see it as a real email first:

```powershell
cd backend
.venv\Scripts\python manage.py send_signature
```

Django fills the placeholders from `SIGNATURE_NAME`, `SIGNATURE_ROLE`,
`COMPANY_PHONE` and `COMPANY_WEBSITE` in `backend/.env`, reading the markup
straight from `brand/signature/` so there is only ever one copy to maintain.

### Backend API

| Method | Path                      | Purpose                                   |
| ------ | ------------------------- | ----------------------------------------- |
| GET    | `/api/health/`            | Health check                              |
| GET    | `/api/plans/`             | Active pricing plans (public)             |
| GET    | `/api/plans/<slug>/`      | One plan                                  |
| GET    | `/api/addons/`            | Active optional extras (public)           |
| POST   | `/api/contact/`           | Contact form submission                   |
| POST   | `/api/project-requests/`  | "Get started" form submission             |

Plans, inquiries and requests are managed in the Django admin at `/admin/`.
Form endpoints are rate-limited per IP (default 20/hour) and send an email notification
if `NOTIFY_EMAIL` is set.

## Running locally

### 1. Backend (Django)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_plans          # creates the plan and the add-on
python manage.py createsuperuser     # for /admin/
python manage.py runserver           # http://localhost:8000
```

### 2. Frontend (Next.js)

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev                          # http://localhost:3000
```

The site works without the backend running (pricing falls back to static values), but the
contact and get-started forms need the API to accept submissions.

### Tests

```powershell
cd backend
.venv\Scripts\python manage.py test
```

```powershell
cd frontend
npm run lint
npm run build
```

## Editing content

| What                                   | Where                                   |
| -------------------------------------- | --------------------------------------- |
| Company name, email, prices (fallback) | `frontend/src/lib/site.ts`              |
| Services, steps, FAQ, fallback plan    | `frontend/src/lib/content.ts`           |
| Live prices shown on the site          | Django admin → Plans and Add-ons        |
| Theme colours                          | `frontend/src/app/globals.css`          |

The public email is blank, so every enquiry comes through the contact form. Fill in
`publicEmail` in `site.ts` and `PUBLIC_EMAIL` in `backend/.env` when a company
mailbox exists.

**If a form submission does not arrive, restart the Django server.** It reads
`.env` once at startup, so a server left running across a config change keeps the
old values. The server log now says `Notification email sent to ...` on every
success, which makes this easy to confirm.

## Environment variables

**backend/.env** (see `backend/.env.example`): `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`,
`DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `NOTIFY_EMAIL`, SMTP settings.

**frontend/.env.local** (see `frontend/.env.example`): `NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_SITE_URL`, optional `API_URL` for server-side requests.

## Privacy: two separate addresses

The owner does not want the business traced back to them personally, so the site
carries **no personal name and no phone number anywhere**. A test in
`backend/core/tests.py` fails if a name, job title or `tel:` link appears in the
signature.

| Setting | Visibility | Purpose |
| --- | --- | --- |
| `PUBLIC_EMAIL` | Shown on the site and in the signature | Blank for now. Must be a company address |
| `NOTIFY_EMAIL` | Private, never rendered | Receives form submissions |

`PUBLIC_EMAIL` is **deliberately blank**. There is no company mailbox yet, and a
published address that bounces is worse than none. While it is empty:

- the website shows a "Send us a message" link to the contact form instead of an address
- the email signature drops its email row entirely

Set `PUBLIC_EMAIL` in `backend/.env` and `publicEmail` in
`frontend/src/lib/site.ts` once a real company mailbox exists, and both come
back automatically.

The contact form is the safest channel for visitors, because it exposes no
address at all.

> **Still to do.** Gmail forces the *sending* address to be the authenticated
> account, so outgoing mail currently reads
> `Orbit Software <the personal Gmail>`. The display name is the company, but the
> raw address is still visible to anyone who looks. To close that gap, create a
> neutral mailbox (a company Gmail, or `hello@` once the domain is registered)
> and point `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` and `NOTIFY_EMAIL` at it.
> Nothing else needs to change.

## Email notifications (Gmail)

Contact and get-started submissions are emailed to `NOTIFY_EMAIL`, which is already
set in `backend/.env`. That file is gitignored, so the address never reaches the repo.

Gmail will not accept your normal account password over SMTP. You need an **App
Password**, which requires 2-Step Verification on the Google account:

1. Turn on 2-Step Verification at <https://myaccount.google.com/security>.
2. Create an App Password at <https://myaccount.google.com/apppasswords>
   (choose "Mail", then any device name).
3. Paste the 16-character password into `backend/.env`:

   ```
   EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop
   ```

4. Restart the Django server and send a test message:

   ```powershell
   cd backend
   .venv\Scripts\python manage.py test_email
   ```

While `EMAIL_HOST_PASSWORD` is empty, emails are printed to the Django console
instead of being sent, so the forms keep working either way. A mail failure is
logged and never breaks a form submission for the visitor.

### How emails appear

Emails the site sends arrive as **Orbit Software**, not as a bare Gmail address.
Gmail requires the underlying address to stay the authenticated account, so only
the display name changes:

```
From: Orbit Software <your-sending-address>
```

Change the name with `COMPANY_NAME` in `backend/.env`.

Notification emails also set `Reply-To` to the person who filled in the form, so
pressing Reply answers the customer rather than yourself.

**Replies you type by hand in Gmail still show your own Gmail profile name.**
That is a Gmail account setting, not something this project controls. To change
it, open Gmail Settings, then "Accounts and Import", then "Send mail as", and
edit the name on your address.

The address shown publicly on the website is separate, and lives in
`frontend/src/lib/site.ts`. Change it there if you would rather display a
business address than your personal Gmail.

## Deploying to Render

[`render.yaml`](render.yaml) is a Blueprint. In the Render dashboard choose
**New > Blueprint**, point it at this repository, and it creates three things:

| Resource | What it is |
| --- | --- |
| `orbit-db` | Managed Postgres |
| `orbit-backend` | Django API and admin |
| `orbit-frontend` | The public website |

Render prompts for the values that are not in the repository. Have these ready:

| Variable | Value |
| --- | --- |
| `EMAIL_HOST_USER` | The Gmail address that sends mail |
| `EMAIL_HOST_PASSWORD` | Its Google App Password |
| `NOTIFY_EMAIL` | Where form submissions are emailed |
| `PUBLIC_EMAIL` | Leave **blank** until a company mailbox exists |
| `COMPANY_WEBSITE` | The site's domain, shown in the signature |
| `SIGNATURE_FORBIDDEN_TERMS` | Words the signature must never contain |
| `NEXT_PUBLIC_SITE_URL` | The frontend's own URL |
| `CORS_ALLOWED_ORIGINS` | Leave blank, see below |

`DJANGO_SECRET_KEY` is generated by Render. `DATABASE_URL` is wired from the
database automatically. Neither needs typing.

### How the two services talk

Only the frontend is meant to be visited. It proxies `/api/*` to Django over
Render's private network, so the browser only ever sees one origin and **no
CORS configuration is needed**. Render injects the backend's private address as
`API_URL`; the Next.js server adds the scheme and forwards the request.

Django still gets its own `onrender.com` URL. That is how you reach `/admin/`.

### First deploy

`build.sh` runs `collectstatic`, `migrate` and `seed_plans` on every deploy, so
the database and the pricing plan are ready without manual steps. Create your
admin login once the first deploy finishes:

```
# Render dashboard > orbit-backend > Shell
python manage.py createsuperuser
```

### Things to know about the free plan

- Free services sleep after 15 minutes idle. The first request afterwards takes
  roughly 30 seconds while the service wakes.
- Free Postgres is deleted after 30 days. Upgrade the database before then, or
  the submissions stored in it are lost.
- Both services are pinned to the Frankfurt region, the closest to South Africa.

### Running the production build locally

```powershell
cd frontend
$env:API_URL = "localhost:8000"   # host:port, as Render supplies it
$env:NEXT_PUBLIC_API_URL = ""     # browser uses relative URLs
npm run build
npm start
```

Django must be running on port 8000. The site then behaves exactly as it will
on Render, including the same-origin proxy.

## Client portal

Clients sign in at `/login` and see their next payment, their live site, what
their plan covers, their invoices and a Pay now button.

### How someone gets a profile

**They sign themselves up.** The header's **Sign in** button leads to the login
page, and from there to `/register`. That creates a login and an account marked
**Pending setup**: no plan, no fees, nothing to pay. All it buys them is a place
to talk to us from. You get an email about every sign-up.

Nothing a visitor sends can change that. The registration form accepts a name,
an email, a business name and a password, and no other field is read, so there
is no way to arrive already on a plan or already active. Give them a plan in the
admin when you are ready and the billing appears on their page.

**They ask for work from their own page.** Signed in, a client picks a service
and describes what they want. It lands in **Service requests** in the admin.
Changing the status there is how you tell them where it stands, because they see
that status on their page. `internal_notes` is yours and is never sent to them.

### Creating a client login yourself

**Through the admin, no shell needed.** Render's free plan has no shell, so the
admin page does the whole job. Sign in at `/admin/`, open **Client accounts**,
press **Add**, and fill in the client's name and email. A login is created with
a generated password, shown once in the green bar at the top of the next page.
Copy it there and then: nothing stores it and nothing can recover it.

The admin login itself is created on deploy from `DJANGO_SUPERUSER_EMAIL` and
`DJANGO_SUPERUSER_PASSWORD`. Set both in the backend's environment before the
first deploy, then clear the password once you have signed in and changed it.
Re-running is harmless: it never resets a password that already exists.

**From a shell, if you have one.** On a paid plan, or locally:

```
python manage.py create_client --name "Their Name" --email "their@email.com" --first-invoice --setup-fee
```

That also raises their first invoice in the same step.

### How payments settle

An invoice is only marked paid after asking Paystack directly what happened.
The webhook signature is checked, and the webhook is then treated as a prompt
to go and verify rather than as the answer. A forged or replayed callback
achieves nothing, and the amount and currency Paystack reports must match what
was recorded when the payment started.

While `PAYSTACK_SECRET_KEY` is blank, Pay now returns a clear message saying
card payments are not available yet.

## Next steps

- **Paystack:** create an account, then set `PAYSTACK_SECRET_KEY` on the
  backend service and add the webhook URL in the Paystack dashboard,
  pointing at `/api/billing/paystack/webhook/` on the backend.
- Register a domain and point it at the frontend service in Render.
- Create a company mailbox, then set `PUBLIC_EMAIL` so the address returns
  to the site and the signature.
