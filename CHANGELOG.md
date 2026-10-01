# CHANGELOG.md — Version & Evolution History

## [1.0.0] - 2026-10-01
### Added
- Complete commercial-grade Indian Pharmacy Operating System (PharmacyOS).
- 5-Tier **Shelf Intelligence Engine** (`Store` ➔ `Zone/Room` ➔ `Rack` ➔ `Shelf` ➔ `Bin`) with instant sub-second locator, shelf relocation workflows, and printable shelf bin label badges.
- Clinical **Batch & Expiry Risk Center** with automated FEFO prioritization, 30/60/90 day warning tiers, expired batch safety lock, and financial loss liability accounting.
- High-Speed **Retail Point of Sale (POS)** counter with keyboard shortcuts (F2), instant barcode/salt lookup with shelf location hints, Schedule H/H1 doctor name & pharmacist sign-off regulatory validation, split tender (Cash with change calculator, UPI, Card), and ESC/POS thermal receipt (58mm/80mm) + A4 invoice generation.
- **Branded Customer Ordering Storefront** (`/store/[slug]`) with mobile-first search, category filtering, cart, prescription upload (PDF/images), delivery/pickup checkout, and live order tracking.
- **Pharmacist Prescription Review Queue** with statutory sign-off, registration number recording, and order state transition gating.
- **Visual Pick List Routing** sorting order items by physical walking sequence (`pickingOrder`) to minimize picker transit time in physical stores.
- **Multi-Store & Chain Operations** (Connaught Place CP-01 & Green Park GP-02) with branch switcher, consolidated Owner Command Center, and inter-store stock transfers.
- **Procurement & Goods Receiving** with supplier directory, purchase orders, batch creation, and shelf binning.
- **Cash Drawer Sessions** with shift opening float, cash sales calculation, closing counts, and variance tracking.
- **SaaS Platform Super Admin** (`/admin`) with tenant organization directory, subscription management (Solo, Growth, Chain), and system health metrics.
- Complete automated test suite: 15 passing tests across unit, domain, financial tax, and integration workflows.
