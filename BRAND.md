# Orbit Software brand guide

The rules this project sticks to. When something new gets built, it follows this
page rather than inventing a fresh style.

Everything here is already wired into the code. Colours live as CSS custom
properties in [`frontend/src/app/globals.css`](frontend/src/app/globals.css) and
are exposed to Tailwind as utility classes, so you write `bg-brand` or
`text-muted-foreground` rather than pasting hex codes into components.

---

## 1. Voice

Plain, confident, no jargon. We sell to business owners, not developers.

| Do | Don't |
| --- | --- |
| "We host your site and keep it secure." | "Enterprise-grade cloud infrastructure." |
| "One flat monthly fee." | "Flexible pricing options available." |
| "Talk to the team that built your site." | "Leverage our world-class support." |

Say **built by a software team**, never **cheap** or **budget**. The low price is
a fact we state plainly; it is not the brand.

Sentences stay short. One idea per sentence. British or South African spelling,
so "optimised", not "optimized".

---

## 2. Colour

### Core palette

| Token | Hex | Where it is used |
| --- | --- | --- |
| `brand` | `#0b5fff` | Buttons, links, icon fills, active states |
| `brand-hover` | `#0049d6` | Button hover |
| `brand-soft` | `#e9f0ff` | Icon badge backgrounds, soft callouts |
| `navy` | `#071630` | Hero, page headers, CTA bands, footer, nav bar |
| `navy-2` | `#0c2148` | Raised cards sitting on navy |
| `foreground` | `#0b1324` | Body text |
| `muted-foreground` | `#4b5563` | Secondary text |
| `muted` | `#f4f6fa` | Alternating section backgrounds |
| `border` | `#e2e7ef` | Hairlines, card borders |

### Accents

Sky blue `#38bdf8` and `#7cc8ff` carry the orbit motif: satellites, ring strokes,
eyebrow text on dark sections, and icon glyphs on navy. Emerald `#10b981` means
one thing only, which is a healthy or live status. Never decoration.

### Rules

- One brand blue. No second accent colour gets introduced for variety.
- Dark sections use **navy**, not black and not grey.
- Gradients run blue to sky, as in `from-brand to-sky-400`, and only on small
  surfaces: a card top edge, a chart bar, a badge on hover.
- Dark mode is a token swap, not a redesign. Every colour has a dark value in
  `globals.css`, so components never hard-code a light or dark colour.

---

## 3. Typography

### Web

**Geist Sans** for everything, **Geist Mono** for code. Both load through
`next/font` in [`layout.tsx`](frontend/src/app/layout.tsx), so they are
self-hosted and do not cause a flash of unstyled text.

| Role | Size | Weight | Tracking |
| --- | --- | --- | --- |
| Hero headline | 44 to 64px, fluid | 600 | `-0.02em` |
| Page title | 36 to 48px | 600 | `-0.02em` |
| Section heading | 30 to 36px | 600 | `-0.02em` |
| Card title | 18px | 600 | normal |
| Body | 16px | 400 | normal |
| Lede paragraph | 18 to 20px | 400 | normal |
| Small print | 13 to 14px | 400 | normal |
| Eyebrow | 14px | 600 | `0.12em`, uppercase |

### Rules

- Headings are **semibold (600)**, never 700 or 800. Weight comes from size,
  not from heaviness.
- Negative tracking on anything 30px and above. Nothing below that.
- Body text never goes past about 70 characters per line. Use `max-w-xl` or
  `max-w-3xl` rather than letting text run the full container.
- Line height 1.5 or looser for paragraphs, tight for headlines.
- The eyebrow above a section heading is the only uppercase text on the site.

### Email

Email clients strip web fonts, so email uses a system stack and never Geist:

```
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
```

---

## 4. Logo

The mark is **Aperture**: a rounded square with a circular hole and a single
slice cut out to the right edge, with a solid core in the middle. It reads as a
lens and as the letter O. Defined in
[`Logo.tsx`](frontend/src/components/Logo.tsx) and mirrored as a favicon in
[`icon.svg`](frontend/src/app/icon.svg).

The wordmark sets **Orbit** in bold and **Software** in regular at 75% opacity.

- Flat shapes in one colour plus a knockout. No gradients, strokes or glow.
- The knockout must match whatever sits behind the mark. Pass `onNavy` in the
  dark header, which swaps the white knockout for navy so there is no halo.
- Minimum size 20px, which is where the slice is still legible. Below that, drop
  the wordmark and use the mark alone.
- Clear space on all sides equals the mark's corner radius.
- Never stretch, recolour or add effects.

Three alternative marks were drawn and are kept in
[`brand/logo/preview.html`](brand/logo/preview.html) with the reasoning for
each. Open it in a browser to compare them at four sizes on light and dark.

## 5. Shape and depth

| Element | Radius |
| --- | --- |
| Buttons, inputs | 6px (`rounded-md`) |
| Cards, tiles, icon badges | 16px (`rounded-2xl`) |
| Pills and status chips | full |

Shadows are soft, wide and nearly colourless. They signal lift, never drama.
Cards rest flat and lift 4px on hover, with the shadow deepening over 300ms.

Borders do most of the separating work. A 1px hairline in `border` is preferred
over a heavy shadow.

---

## 6. Icons

[Lucide](https://lucide.dev) only, at stroke width **1.75**. Never mix icon sets.

Icons sit inside a rounded square badge with a soft brand gradient and a hairline
ring, built once in [`IconTile.tsx`](frontend/src/components/IconTile.tsx). Use
`IconBadge` on light backgrounds and `IconBadgeDark` on navy. On hover the badge
fills with brand blue and the glyph scales slightly.

| Size | Badge | Glyph |
| --- | --- | --- |
| `sm` | 44px | 20px |
| `md` | 56px | 24px |
| `lg` | 64px | 28px |

An icon always carries meaning. Decorative ones get `aria-hidden="true"`.

---

## 7. Layout

- Page gutter and max width come from `containerClass` in
  [`Container.tsx`](frontend/src/components/Container.tsx). It is 1600px wide
  with responsive padding. Header bars and the mega-menu import the same
  constant so everything lines up.
- Sections breathe: `py-20` on small screens, `py-28` on large.
- Backgrounds alternate white, `muted`, white, navy down the page so sections
  separate without extra dividers.
- Dark sections share one animated backdrop,
  [`OrbitBackground.tsx`](frontend/src/components/OrbitBackground.tsx): aurora
  glows, a starfield, a faint grid and orbit rings with travelling satellites.
  All of it stops under `prefers-reduced-motion`.

---

## 8. Motion

Transitions are 150ms for colour and 300ms for movement, always eased.

Movement is small. A card lifts 4px, a glyph scales 10%, an arrow slides 2px.
Nothing bounces, spins or slides in from off-screen. Ambient animation, such as
the aurora and satellites, runs slowly enough to read as atmosphere rather than
activity.

Every animation respects `prefers-reduced-motion`.

---

## 9. Email

The signature lives in [`brand/signature/`](brand/signature/). Open
`preview.html` in a browser to fill in the details and copy it. That page is
generated from `signature.html` by `build_preview.py`, so the markup has exactly
one home and the preview can never drift from what gets sent.

System emails are branded through `COMPANY_NAME` in `backend/.env`, so mail
arrives as:

```
From: Orbit Software <the private inbox address>
```

Notification emails set `Reply-To` to the person who filled in the form.

---

## 9a. Privacy rule

**Nothing public may identify the owner personally.** The business must not be
traceable to an individual.

That means no personal name, no job title and no phone number on the website, in
the signature, or in any email the site sends. This is enforced by a test in
`backend/core/tests.py` that fails if a personal name, a job title or a `tel:`
link appears in the signature.

Two addresses, kept apart on purpose:

| Setting | Visibility | Purpose |
| --- | --- | --- |
| `PUBLIC_EMAIL` | Shown on the site and in the signature | Must be a company address |
| `NOTIFY_EMAIL` | Private, never rendered | Receives form submissions |

The contact form is the safest channel, because it exposes no address at all.

## 10. Changing the brand

Nearly everything flows from two files.

| Change | File |
| --- | --- |
| Colours, dark mode, textures | `frontend/src/app/globals.css` |
| Name, contact details, prices, nav | `frontend/src/lib/site.ts` |
| Marketing copy, services, FAQ | `frontend/src/lib/content.ts` |
| Sender name on emails | `backend/.env` (`COMPANY_NAME`) |
| Public email address | `backend/.env` (`PUBLIC_EMAIL`) and `site.ts` |
| Prices | Django admin (Plans, Add-ons), `site.ts` for the fallbacks |

Change the brand blue in `globals.css` and the entire site follows, including
dark mode. That is the point of the token layer, so resist writing a raw hex
value into a component.
