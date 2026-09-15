# TechnoAi PO Shipment Tracking — Backend API

REST API for TechnoAi purchase order shipment tracking. Supports a public PO lookup endpoint and authenticated staff endpoints for PO management.

## Requirements

- Node.js 18+
- MongoDB

## Setup

```bash
cp .env.example .env
npm install
```

Update `.env` with your MongoDB URI and JWT secret.

## Run

```bash
npm run dev
```

Health check: `GET /health`

## Bootstrap admin

The first account must be created via:

`POST /api/users/register`

After that, only administrators can create staff via `POST /api/users/staff`.

## Roles

| Role | Access |
| --- | --- |
| `administrator` | Full access, user management, delete POs |
| `dataEntry` | Create/update POs and line items |
| `viewer` | Read-only access |

## API overview

### Public

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/track/:poNumber` | Public shipment lookup by PO number |

### Authenticated (Bearer token)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/users/login` | Staff login |
| GET | `/api/users/account` | Current user profile |
| GET | `/api/dashboard/summary` | Dashboard stats |
| GET | `/api/purchase-orders` | List POs (filters + pagination) |
| GET | `/api/purchase-orders/search?q=` | Find PO by PO or SO number |
| GET | `/api/purchase-orders/:id` | PO detail |
| POST | `/api/purchase-orders` | Create PO |
| PUT | `/api/purchase-orders/:id` | Update PO header fields |
| DELETE | `/api/purchase-orders/:id` | Delete PO (admin) |
| POST | `/api/purchase-orders/:id/lines` | Add line item |
| PUT | `/api/purchase-orders/:id/lines/:lineNumber` | Update line item |
| DELETE | `/api/purchase-orders/:id/lines/:lineNumber` | Remove line item |
| GET | `/api/purchase-orders/:id/activity` | Activity history |

## Seed demo data

```bash
npm run seed
```

Creates demo POs `4500002233` and `4500003055` matching the frontend mock data.

## Line statuses

- Processing
- Ready to Ship from Supplier
- In Transit
- In Inventory
- Ready for Delivery
- Delivered

POs auto-close when all lines are Delivered and reopen if a line is reverted.

## Email notifications

Set these in `.env` to enable shipment alerts:

| Variable | Required | Description |
| --- | --- | --- |
| `EMAIL_NOTIFICATIONS_ENABLED` | Yes | Set to `true` to send emails |
| `EMAIL` | Yes | Gmail address used to send mail |
| `APP_PASSWORD` | Yes | Gmail [App Password](https://support.google.com/accounts/answer/185833) (not your normal login password) |
| `PUBLIC_TRACKING_URL` | Recommended | Public site URL for links in emails, e.g. `https://tracktechnoai.vercel.app` |
| `INTERNAL_EMAIL_TRACKING` | Optional | Internal inbox for PO created + line status updates (default: `tracking@technoai.ae`) |
| `INTERNAL_EMAIL_PO_CLOSED` | Optional | Comma-separated list for PO closed alerts (default: tracking, info, logistics, tii, accounts @technoai.ae) |
| `SMTP_FROM` | Optional | Custom From header; defaults to `EMAIL` |

### What triggers emails

| Event | Internal recipients | Client subscribers |
| --- | --- | --- |
| PO created | `INTERNAL_EMAIL_TRACKING` | — |
| Line status change | `INTERNAL_EMAIL_TRACKING` | Subscribers for that PO |
| PO closed (all lines delivered) | `INTERNAL_EMAIL_PO_CLOSED` | Subscribers for that PO |

Client subscribers opt in from the public tracking page via **Get Updates** (no email verification).

Remarks/ETA-only updates do **not** send emails — only status changes.

Legacy: `LINE_STATUS_NOTIFICATIONS_ENABLED=true` also enables sending if `EMAIL_NOTIFICATIONS_ENABLED` is unset.

## Notes

- Reports (Excel/CSV/PDF) are planned for a later phase.
