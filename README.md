# LoyaltyClub

A generic multi-business loyalty platform: each business runs its own program (points, tiers, rewards, offers), members join via a slug, and staff record check-ins and redeem coupons at the counter.

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma + SQLite
- bcryptjs (password hashing), qrcode (QR check-in)

## Setup

```bash
npm install
npx prisma migrate dev
node prisma/seed.mjs
npm run dev
```

## Demo accounts

All demo passwords are `password123`.

| Email                  | Role            | Business        | Join slug         |
| ---------------------- | --------------- | --------------- | ----------------- |
| `owner@bluecup.test`   | Business owner  | Blue Cup Coffee | `blue-cup-coffee` |
| `staff@bluecup.test`   | Staff           | Blue Cup Coffee |                   |
| `member1@bluecup.test` | Member          | Blue Cup Coffee |                   |
| `member2@bluecup.test` | Member          | Blue Cup Coffee |                   |
| `owner@irongym.test`   | Business owner  | Iron Gym        | `iron-gym`        |
| `member1@irongym.test` | Member          | Iron Gym        |                   |
| `member2@irongym.test` | Member          | Iron Gym        |                   |
| `member3@irongym.test` | Member          | Iron Gym        |                   |
| `owner@velvetthread.test` | Business owner | Velvet Thread | `velvet-thread`  |
| `staff@velvetthread.test`  | Staff          | Velvet Thread |                  |
| `member1@velvetthread.test` | Member        | Velvet Thread |                  |
| `member2@velvetthread.test` | Member        | Velvet Thread |                  |
| `member3@velvetthread.test` | Member        | Velvet Thread |                  |
| `invited.staff@bluecup.test` | Pending staff invite | Blue Cup Coffee |     |

Velvet Thread is a clothing boutique demo: 2 stitches per USD, Cotton/Silk/Couture tiers, and rewards with coupon expiry ($10 off expires in 45 days).
| `owner@velvetthread.test` | Business owner | Velvet Thread | `velvet-thread`  |
## Features

- Multi-business: anyone can own multiple clubs, each with an isolated program and member base
- Configurable programs: points name, earn rate, minimum redemption, currency, spend-based tiers
- Members: join via slug, view points/tier progress, referral code, redeem rewards for coupons
- Coupon expiry: rewards can set "coupons expire after N days"; expired coupons are flagged lazily on lookup and in the member view
- Staff invites: owners invite staff by email; the invitee signs up with that email and accepts under My invites
- Club discovery: public business profiles at `/b/[slug]` plus a signed-in Explore page with one-click join
- Offers feed: `/app/offers` shows active offers from every club the member belongs to
- Offers: sales and promos per business
- Counter: staff check-in with spend (points awarded automatically) and coupon redemption by code
- Full points ledger: every mutation (EARN / REDEEM / ADJUST) is recorded immutably
- PWA: installable manifest, offline fallback page via service worker

## API surface

- `POST /api/auth/*` — register, login, logout
- `GET /api/me/memberships`, `POST /api/me/join`, `POST /api/me/redeem` — member club actions
- `GET /api/me/invites`, `POST /api/me/invites/[inviteId]/accept` — staff invite inbox
- `POST /api/biz`, `GET /api/biz` — create / list owned businesses
- `GET /api/directory` — public club directory
- `/api/biz/[businessId]/overview|program|rewards|offers|members|checkin|coupons|lookup|invites/*` — owner/staff dashboards and counter operations
- Offers feed: `/app/offers` shows active offers from every club the member belongs to
- Offers: sales and promos per business
- Counter: staff check-in with spend (points awarded automatically) and coupon redemption by code
- Full points ledger: every mutation (EARN / REDEEM / ADJUST) is recorded immutably
- PWA: installable manifest, offline fallback page via service worker

## API surface

- `POST /api/auth/*` — register, login, logout
- `GET /api/me/memberships`, `POST /api/me/join`, `POST /api/me/redeem` — member club actions
- `GET /api/me/invites`, `POST /api/me/invites/[inviteId]/accept` — staff invite inbox
- `POST /api/biz`, `GET /api/biz` — create / list owned businesses
- `GET /api/directory` — public club directory
- `/api/biz/[businessId]/overview|program|rewards|offers|members|checkin|coupons|lookup|invites/*` — owner/staff dashboards and counter operations

## Adding a business

1. An owner registers (`/register`) and creates a business from their dashboard.
2. The business gets a unique slug derived from its name (e.g. `blue-cup-coffee`).
3. Members sign up, then join the business's club via that slug.

## Project structure

```
src/
  app/
    api/          # Route handlers (auth, me, biz)
    globals.css   # Global styles
    layout.tsx    # Root layout (TopBar, session)
    page.tsx      # Landing page
  components/     # Client components (forms, PWA register, TopBar)
  lib/
    api.ts        # Response helpers and auth guards
    auth.ts       # Session handling
    loyalty.ts    # Points/tier/coupon engine
    prisma.ts     # Prisma client singleton
prisma/
  schema.prisma   # Data model
  seed.mjs        # Demo data (idempotent)
public/           # Static assets, service worker, offline fallback
```
