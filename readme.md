# RentNest API

A secure, role-based REST API powering **RentNest** — a property rental marketplace where landlords list properties, tenants apply and rent them, and Stripe handles recurring monthly billing end-to-end.

Built with **Express.js**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, and **Stripe Subscriptions**.

Base_url: https://server-rentnest.onrender.com

---

## Table of Contents

- [Overview](#overview)
- [Core Concept: How Renting Works](#core-concept-how-renting-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Stripe Webhook Setup (Local Development)](#stripe-webhook-setup-local-development)
- [API Reference](#api-reference)
- [Authentication & Roles](#authentication--roles)
- [Scripts](#scripts)
- [Deployment](#deployment)

---

## Overview

RentNest connects **landlords**, **tenants**, and **admins** in a single marketplace:

- Landlords list properties, each backed by a real Stripe Product + recurring monthly Price.
- Tenants browse listings, submit rental requests, and — once approved by the landlord — pay via Stripe Checkout to activate a recurring monthly subscription.
- Once subscribed, Stripe automatically charges the tenant every month with no manual action required from either side. The backend stays in sync with the subscription's real-time state (active, past due, cancelled) purely through Stripe webhooks.
- Admins get platform-wide visibility into properties, rentals, and payments.

## Core Concept: How Renting Works

Renting a property is a **multi-step lifecycle**, not a single transaction:

```
1. Tenant submits a Rental Request for a property
                    │
2. Landlord approves or rejects the request
                    │  (only APPROVED requests can proceed)
3. Tenant hits /subscribe → Stripe Checkout Session is created
                    │  (mode: "subscription", tied to the property's Stripe Price)
4. Tenant completes payment on Stripe's hosted checkout page
                    │
5. Stripe fires webhook events back to the API:
   - checkout.session.completed → Rental Request marked COMPLETED
   - invoice.paid              → Rental row created/renewed + Payment recorded
                    │
6. Every subsequent month, Stripe automatically re-charges the tenant's
   saved card and fires invoice.paid again — no route needs to be hit
   manually. The API just listens and stays in sync.
```

### Why a `Rental` row exists separately from `RentalRequest`

`RentalRequest` represents a **one-time application** (pending → approved/rejected → completed). It is not a reliable source of truth for "is this tenant currently paying," because it never changes again once marked `COMPLETED` — even if a card later fails or the subscription is cancelled.

`Rental` represents the **live, ongoing subscription** and is kept continuously in sync with Stripe via webhooks:

| Rental.status | Meaning                                                           |
| ------------- | ----------------------------------------------------------------- |
| `ACTIVE`      | Subscription is current and paid                                  |
| `PAST_DUE`    | A renewal charge failed; Stripe is auto-retrying                  |
| `CANCELED`    | Subscription ended (tenant cancelled, or Stripe gave up retrying) |
| `EXPIRED`     | Reserved for other lifecycle-ending states                        |

Property access / content gating should always check `Rental.status === 'ACTIVE' && currentPeriodEnd > now()` — **never** `RentalRequest.status`.

### Webhook events handled

| Stripe Event                    | What happens                                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `checkout.session.completed`    | Marks the `RentalRequest` `COMPLETED`; creates the `Rental` row                                                  |
| `checkout.session.expired`      | No-op — tenant can retry `/subscribe`                                                                            |
| `invoice.paid`                  | Refreshes the `Rental` billing period; records a `Payment` row (covers both the first payment and every renewal) |
| `invoice.payment_failed`        | Marks `Rental` as `PAST_DUE`; records a failed `Payment` row                                                     |
| `customer.subscription.updated` | Syncs `Rental` status/period with whatever Stripe currently reports                                              |
| `customer.subscription.deleted` | Marks `Rental` `CANCELED`; frees the property back to `AVAILABLE`                                                |

All handlers are written to be **idempotent** and **race-safe** — Stripe can redeliver events, and `checkout.session.completed` / `invoice.paid` can arrive close enough together to be processed concurrently. Handlers upsert on Stripe's own IDs (`stripeInvoiceId`, `stripeSubscriptionId`) rather than blindly creating rows.

---

## Tech Stack

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Runtime        | Node.js + TypeScript                                    |
| Framework      | Express 5                                               |
| ORM / Database | Prisma 7 + PostgreSQL (Neon)                            |
| Auth           | JWT (access token via httpOnly cookie or Bearer header) |
| Payments       | Stripe (Checkout Sessions, Subscriptions, Webhooks)     |
| Dev tooling    | `tsx` (watch mode), `prisma migrate`                    |

---

## Project Structure

```
.
├── prisma
│   ├── migrations/           # Versioned SQL migration history
│   └── schema/                # Prisma schema, split by domain
│       ├── amenity.prisma
│       ├── categories.prisma
│       ├── enums.prisma
│       ├── payments.prisma
│       ├── profile.prisma
│       ├── properties.prisma
│       ├── rental.prisma
│       ├── rentalRequests.prisma
│       ├── reviews.prisma
│       ├── schema.prisma
│       └── users.prisma
├── src
│   ├── config/                # Centralized env var access
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client instance
│   │   ├── stripe.ts          # Stripe SDK instance
│   │   └── stripeCustomer.ts  # getOrCreateStripeCustomer()
│   ├── middleware/
│   │   ├── auth.ts            # JWT auth + role guard
│   │   ├── error.ts
│   │   ├── globalErrorHandler.ts
│   │   └── notfound.ts
│   ├── modules/                # One folder per domain (controller/routes/service/interface)
│   │   ├── amenity/
│   │   ├── auth/
│   │   ├── category/
│   │   ├── checkout/           # Stripe webhook receiver
│   │   ├── payment/            # Payment history (admin/tenant/landlord views)
│   │   ├── property/
│   │   ├── rental/             # Live subscription state + access checks
│   │   ├── rental_request/     # Application lifecycle + checkout session creation
│   │   ├── review/
│   │   └── user/
│   ├── utils/
│   │   ├── catchAsync.ts
│   │   ├── jwt.ts
│   │   └── sendResponse.ts
│   ├── app.ts                  # Express app + route mounting
│   └── server.ts               # Entry point
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (this project is built against [Neon](https://neon.tech))
- A [Stripe](https://dashboard.stripe.com) account (test mode is fine for development)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhook forwarding

### Installation

```bash
git clone <repo-url>
cd server_rentnest
npm install
```

### Database setup

```bash
npx prisma generate
npx prisma migrate dev
```

### Run the dev server

```bash
npm run dev
```

The server starts on the port defined by your environment (see [Environment Variables](#environment-variables)).

---

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=

PORT=5000

CLIENT_URL=http://localhost:3000

BCRYPT_SALT_ROUNDS=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

JWT_ACCESS_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

ADMIN_REGISTRATION_KEY=
```

> Adjust these keys to exactly match whatever `src/config/index.ts` reads — the names above reflect what the codebase currently expects (`config.client_url`, `config.stripe_webhook_secret`, `config.jwt_access_secret`), but double-check against that file since it's the single source of truth.

**Important:** always use Stripe **test mode** keys (`sk_test_...`) during development. Make sure the Stripe CLI is logged into the _same_ Stripe account your keys belong to — `stripe login` authenticates independently of your `.env`, and testing against the wrong account is a common source of "nothing is showing up in my dashboard" confusion.

---

## Stripe Webhook Setup (Local Development)

Webhooks are how Stripe tells the API about payments, renewals, failures, and cancellations — none of the recurring billing logic works without this running.

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and log in: `stripe login`
2. Start your dev server: `npm run dev`
3. In a separate terminal, forward events to your local webhook route:

    ```bash
    npm run stripe:webhook
    ```

    This runs `stripe listen --forward-to localhost:5000/api/webhook/stripe`, matching the route registered in `app.ts` (`app.use("/api/webhook", webhookRoutes)` + the `/stripe` sub-route).

4. **Every time you restart `stripe listen`, it prints a new signing secret** (`whsec_...`). Copy it into `STRIPE_WEBHOOK_SECRET` in your `.env` and restart your dev server — an old secret will cause signature verification to fail.
5. Trigger test events directly if needed:

    ```bash
    stripe trigger checkout.session.completed
    stripe trigger invoice.paid
    ```

For production, configure a webhook endpoint in the Stripe Dashboard pointing at `https://<your-domain>/api/webhook/stripe`, enabling at minimum: `checkout.session.completed`, `checkout.session.expired`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.

---

## API Reference

All routes are prefixed with `/api`. Roles in brackets indicate the required `auth()` role(s); no bracket means public.

### Auth — `/api/auth`

| Method | Path             | Role                    | Description                                     |
| ------ | ---------------- | ----------------------- | ----------------------------------------------- |
| POST   | `/login`         | —                       | Log in, receive access token                    |
| POST   | `/register`      | —                       | Register a new account                          |
| POST   | `/refresh-token` | —                       | Exchange a refresh token for a new access token |
| GET    | `/me`            | ADMIN, LANDLORD, TENANT | Get the current user's profile                  |
| POST   | `/logout`        | ADMIN, LANDLORD, TENANT | Log out                                         |

### Users — `/api/users`

| Method | Path              | Role                    | Description                     |
| ------ | ----------------- | ----------------------- | ------------------------------- |
| POST   | `/create-user`    | ADMIN                   | Admin-created user account      |
| GET    | `/my-profile`     | ADMIN, LANDLORD, TENANT | Get own profile                 |
| PUT    | `/update-profile` | ADMIN, LANDLORD, TENANT | Update own profile              |
| GET    | `/all`            | ADMIN                   | List all users                  |
| PUT    | `/delete-account` | ADMIN                   | Block/deactivate a user account |

### Categories — `/api/categories`

| Method | Path           | Role  | Description         |
| ------ | -------------- | ----- | ------------------- |
| POST   | `/`            | ADMIN | Create a category   |
| GET    | `/`            | —     | List all categories |
| GET    | `/:categoryId` | ADMIN | Get one category    |
| PUT    | `/:categoryId` | ADMIN | Update a category   |
| DELETE | `/:categoryId` | ADMIN | Delete a category   |

### Amenities — `/api/amenities`

| Method | Path          | Role            | Description        |
| ------ | ------------- | --------------- | ------------------ |
| POST   | `/`           | ADMIN, LANDLORD | Create an amenity  |
| GET    | `/`           | —               | List all amenities |
| GET    | `/:amenityId` | ADMIN           | Get one amenity    |
| DELETE | `/:amenityId` | ADMIN, LANDLORD | Delete an amenity  |

### Properties — `/api/properties`

| Method | Path                         | Role            | Description                                                                                                   |
| ------ | ---------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| POST   | `/`                          | LANDLORD        | Create a property (auto-creates Stripe Product + Price)                                                       |
| GET    | `/`                          | —               | Browse available properties (filterable/searchable)                                                           |
| GET    | `/admin`                     | ADMIN           | All properties, any status                                                                                    |
| GET    | `/my-properties`             | LANDLORD, ADMIN | Properties owned by the current landlord                                                                      |
| GET    | `/:propertyId`               | —               | Single property detail — full landlord contact info shown only to the owner or a tenant with an active rental |
| PUT    | `/:propertyId`               | LANDLORD        | Update a property (blocked while an active rental exists)                                                     |
| PUT    | `/change-status/:propertyId` | LANDLORD        | Toggle AVAILABLE/NOTAVAILABLE                                                                                 |
| DELETE | `/:propertyId`               | LANDLORD        | Delete a property (blocked while an active rental exists)                                                     |

### Rental Requests — `/api/rental-requests`

| Method | Path                        | Role     | Description                                                     |
| ------ | --------------------------- | -------- | --------------------------------------------------------------- |
| POST   | `/`                         | TENANT   | Apply to rent a property                                        |
| GET    | `/`                         | ADMIN    | All rental requests                                             |
| GET    | `/my-sent-request`          | TENANT   | Requests the current tenant has submitted                       |
| GET    | `/rental-request-to-me`     | LANDLORD | Requests received on the landlord's properties                  |
| PUT    | `/:requestId`               | LANDLORD | Approve or reject a request                                     |
| PUT    | `/tenant-delete/:requestId` | TENANT   | Withdraw a pending/rejected request                             |
| DELETE | `/:requestId`               | ADMIN    | Permanently delete a (already withdrawn) request                |
| POST   | `/:id/subscribe`            | TENANT   | Create a Stripe Checkout Session to pay for an approved request |

### Rentals — `/api/rentals`

The live subscription/billing state — see [Core Concept](#core-concept-how-renting-works).

| Method | Path                   | Role     | Description                                                  |
| ------ | ---------------------- | -------- | ------------------------------------------------------------ |
| GET    | `/my-rentals`          | TENANT   | Properties the tenant is currently/previously renting        |
| GET    | `/my-property-rentals` | LANDLORD | Active rentals across the landlord's properties              |
| GET    | `/access/:propertyId`  | TENANT   | `{ hasActiveAccess: boolean }` — for frontend content gating |
| GET    | `/all-rental-info`     | ADMIN    | Full platform-wide rental data                               |

### Payments — `/api/payments`

| Method | Path                    | Role     | Description                                    |
| ------ | ----------------------- | -------- | ---------------------------------------------- |
| GET    | `/`                     | ADMIN    | Full payment history across the platform       |
| GET    | `/my-payments`          | TENANT   | The tenant's own payment history               |
| GET    | `/my-property-payments` | LANDLORD | Payments received on the landlord's properties |

### Webhook — `/api/webhook`

| Method | Path      | Description                                                                                                                             |
| ------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/stripe` | Stripe webhook receiver. Requires the **raw** request body for signature verification — never place `express.json()` before this route. |

### Reviews — `/api/reviews`

| Method | Path                        | Role     | Description                               |
| ------ | --------------------------- | -------- | ----------------------------------------- |
| POST   | `/`                         | TENANT   | Create a review                           |
| GET    | `/`                         | ADMIN    | List all reviews                          |
| GET    | `/my-reviews`               | TENANT   | Reviews the current tenant has written    |
| GET    | `/reviews-to-my-properties` | LANDLORD | Reviews left on the landlord's properties |
| PUT    | `/edit/:reviewId`           | TENANT   | Edit own review                           |
| PUT    | `/status/:reviewId`         | ADMIN    | Approve/moderate a review                 |
| DELETE | `/:reviewId`                | TENANT   | Delete own review                         |

---

## Authentication & Roles

Authentication is JWT-based. The access token is read from either:

- an `accessToken` httpOnly cookie, or
- an `Authorization: Bearer <token>` header

Three roles exist: `TENANT`, `LANDLORD`, `ADMIN`. Route-level access is enforced with `auth(...requiredRoles)` middleware — omit roles to just require _any_ authenticated user.

Blocked users (`ActiveStatus.BLOCKED`) are rejected at the middleware level even with a valid token.

---

## Scripts

| Script                   | Purpose                                                   |
| ------------------------ | --------------------------------------------------------- |
| `npm run dev`            | Start the dev server with hot reload (`tsx watch`)        |
| `npm run build`          | Generate the Prisma client and compile TypeScript         |
| `npm start`              | Run the compiled production build                         |
| `npm run stripe:webhook` | Forward Stripe events to your local server via Stripe CLI |
| `npm run render-build`   | Production build step used on Render                      |
| `npm run vercel-build`   | Production build step used on Vercel                      |

---

## Deployment

Currently deployed on **Render**.
