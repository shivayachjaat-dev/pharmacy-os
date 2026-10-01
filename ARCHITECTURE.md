# ARCHITECTURE.md — System Architecture & Design Specification

## 1. High-Level Architecture

PharmacyOS follows a **modular monolith** design built on Next.js 15, TypeScript, and a relational data layer. It provides strict tenant boundary enforcement, domain service segregation, and distinct UI presentation layers for Store Staff, Business Owners, End Customers, and Platform Administrators.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PRESENTATION LAYER                              │
│                                                                             │
│  ┌─────────────────────────┐  ┌───────────────────────┐  ┌───────────────┐  │
│  │   Owner Command Center  │  │   Customer Storefront │  │  Super Admin  │  │
│  │   & Store Operations    │  │   (/store/[slug])     │  │  (/admin)     │  │
│  │   - POS & Billing       │  │   - Medicine Search   │  │  - SaaS Orgs  │  │
│  │   - Shelf Intelligence  │  │   - Rx Upload         │  │  - Plans/Subs │  │
│  │   - Inventory & Expiry  │  │   - Cart & Checkout   │  │  - System     │  │
│  │   - Transfers & Reports │  │   - Order Tracking    │  │    Health     │  │
│  └───────────┬─────────────┘  └───────────┬───────────┘  └───────┬───────┘  │
└──────────────┼────────────────────────────┼──────────────────────┼──────────┘
               │                            │                      │
┌──────────────▼────────────────────────────▼──────────────────────▼──────────┐
│                             APPLICATION SERVICES                            │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────────┐  │
│  │ InventoryService │  │   BillingService │  │ OrderFulfillmentService   │  │
│  │ - Batch FEFO     │  │ - Price Calc     │  │ - Rx Review Workflow      │  │
│  │ - Shelf Binning  │  │ - Tax (GST/HSN)  │  │ - Inventory Reservation   │  │
│  │ - Transfers      │  │ - Split Tender   │  │ - Pick List Routing       │  │
│  └──────────────────┘  └──────────────────┘  └───────────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────────┐  │
│  │  CatalogService  │  │ ProcurementServ. │  │ Notification & Gateway    │  │
│  │ - Generic/Brand  │  │ - Purchase Order │  │ - Razorpay Adapter        │  │
│  │ - Schedules      │  │ - Goods Receipt  │  │ - WhatsApp/SMS Adapter    │  │
│  └──────────────────┘  └──────────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                               DATA LAYER                                    │
│                                                                             │
│   Prisma ORM (Schema, Typed Client, Atomic Transactions, Ledger Engine)      │
│   SQLite (Embedded portable default) / PostgreSQL (Production ready)         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Subsystems

### 2.1 Shelf Intelligence Subsystem
- Physical Location hierarchy:
  - `Store` (Physical outlet)
  - `Zone` (e.g. Ground Floor Counter, Cold Storage, Back Room)
  - `Rack` (e.g. R-01, R-02)
  - `Shelf` (e.g. S-01, S-02)
  - `Bin` (e.g. B-01, B-02)
- Normalized representation: A unique `Location` record has `fullCode` = `GF/R-01/S-02/B-03`.
- Stock is held in `BatchLocationStock`: connecting `(batchId, locationId)` with `quantity`.
- Order Picking routes compute a pick path sorted by Location walk sequence, minimizing staff transit time.

### 2.2 Inventory & Ledger Subsystem
- Stock updates never overwrite numbers in isolation.
- Every change writes an `InventoryLedgerEntry` recording:
  - `type`: `PURCHASE_RECEIPT`, `SALE`, `SALE_RETURN`, `TRANSFER_OUT`, `TRANSFER_IN`, `ADJUSTMENT`, `EXPIRED_DISPOSAL`
  - `batchId`, `locationId`, `quantityDelta`, `reason`, `userId`, `timestamp`.

### 2.3 Regulatory Compliance & Safeguards Subsystem
- Products have a mandatory `schedule` classification: `OTC`, `SCHEDULE_H`, `SCHEDULE_H1`, `SCHEDULE_X`, `NARCOTIC`.
- Rules enforced:
  1. Schedule H/H1/X items cannot be dispensed at POS without customer name, doctor name, and registered pharmacist verification.
  2. Online orders with scheduled medicines remain in `AWAITING_PRESCRIPTION_REVIEW` until a licensed pharmacist reviews the uploaded prescription image/PDF and signs off.
  3. Expired batches are blocked from sale automatically by date comparison.

### 2.4 Customer Storefront Subsystem
- Dynamic organization slug routing: `/store/[slug]`.
- Customer accounts with phone number verification and address book.
- Multi-store routing: Customer delivery address is matched to nearest available store with required inventory.

---

## 3. Technology Choices Justification
- **Next.js 15 App Router**: Server components for high performance, server actions for secure server execution, API routes for webhooks.
- **Prisma ORM**: Strict TypeScript types, migration management, easy portability between SQLite (instant zero-dependency dev & test) and PostgreSQL (production).
- **Zod**: Type-safe validation across API boundaries, forms, and environment variables.
- **Tailwind CSS + Radix UI**: High-density, accessible UI optimized for 10-key numeric pads and barcode scanners.
