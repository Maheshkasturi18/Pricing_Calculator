# Multi-Rate Pricing Calculator

A full-stack pricing calculator that supports line-item discounts, tax calculation, draft/finalized documents, and reporting.

## Tech Stack

- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- Session-based authentication
- Jest

## Prerequisites

- Node.js 18+
- npm
- MongoDB (local or MongoDB Atlas)

## Setup

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
MONGO_URI=<your-mongodb-connection-string>
SESSION_SECRET=<your-session-secret>
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

Start the backend:

```bash
npm run dev
```

### Frontend

In a separate terminal:

```bash
cd frontend
npm install
```

Create `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Run tests

```bash
cd backend
npm test
```

## Calculation and Rounding Policy

All authoritative calculations are performed **server-side**.

Money values are converted to **integer cents** to avoid floating-point precision issues.

For each line:

1. `subtotal = quantity × unit price`
2. Apply either a percentage discount or fixed discount.
3. `afterDiscount = subtotal − discount`
4. `tax = afterDiscount × tax rate`
5. `lineTotal = afterDiscount + tax`

Tax is calculated **after the discount**.

Percentage calculations are rounded to the nearest cent. Document totals are calculated by summing the line values in cents.

A fixed discount greater than the line subtotal is rejected rather than clamped.

The calculation module also includes unit tests covering the key calculation and validation scenarios.

### Worked Example

| Line                                      |    Subtotal |   Discount | After Discount |        Tax |  Line Total |
| ----------------------------------------- | ----------: | ---------: | -------------: | ---------: | ----------: |
| Widget A — 2 × $100, 10% discount, 5% tax |     $200.00 |     $20.00 |        $180.00 |      $9.00 | **$189.00** |
| Widget B — 1 × $50, 5% tax                |      $50.00 |      $0.00 |         $50.00 |      $2.50 |  **$52.50** |
| Service — 1 × $200, $20 fixed discount    |     $200.00 |     $20.00 |        $180.00 |      $0.00 | **$180.00** |
| **Total**                                 | **$450.00** | **$40.00** |              — | **$11.50** | **$421.50** |

## Finalize / Immutability Rules

- **Draft:** Documents can be created, edited, and deleted.
- **Finalized:** Documents become immutable.
- `PUT` and `DELETE` requests on finalized documents return `409 DOCUMENT_FINALIZED`.
- Finalization validates that quantity is greater than `0` and unit price is non-negative.
- A finalized document can be duplicated into a new draft using the duplicate action.

## Assumptions and Tradeoffs

- Line items are embedded inside the document because they are only accessed as part of their parent document.
- Calculated totals are stored on the document and recalculated whenever a draft is created or updated.
- Fixed discounts greater than the subtotal are rejected instead of silently clamped.
- The application is built with Node.js and Express, with the core pricing logic separated into a dedicated calculation module for maintainability and testability.
- Draft updates currently follow a last-write-wins approach. Production would use optimistic concurrency control or another explicit concurrency strategy.

## What I Would Improve Before Production

- Add PDF export so finalized pricing documents can be downloaded and shared as professional quotations.
- Add customer and reusable product/service management to speed up recurring quotations.
- Add quotation workflow statuses such as Sent, Accepted, and Rejected.
- Add quotation validity/expiry dates and reminders.
- Further improve the UI with a more polished, responsive, and accessible experience.

## Deployed URL

**Frontend:** `https://<your-app>.vercel.app`

**Backend API:** `https://<your-app>.onrender.com/api`
