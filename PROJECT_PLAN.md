# PROJECT_PLAN.md — PharmacyOS Engineering Roadmap

## Overview
PharmacyOS is a commercial-grade, multi-tenant pharmacy commerce and operations system built for the Indian market. The implementation is planned across 9 structured phases, guaranteeing measurable, incremental delivery of high-value vertical slices.

---

## Phase Breakdown

### Phase 0: Repository, Tooling & Foundation
- Scaffold Next.js 15 full-stack app with TypeScript, Tailwind CSS, Lucide icons, and modern tooling.
- Set up Prisma ORM with SQLite (portable zero-config) and PostgreSQL migration pathway.
- Implement base layout systems (Internal App layout, Customer Storefront layout, Admin layout).
- Establish session/tenant context resolution and mockable/switchable authentication provider.
- Configure testing suite (Vitest for unit/integration tests).

### Phase 1: Product Master & Shelf Intelligence
- Comprehensive product catalogue: Generic salts, brand names, manufacturer, schedule (OTC, Schedule H, H1, X), dosage form, pack conversions, GST tax slabs (0%, 5%, 12%, 18%), HSN codes.
- 5-Tier physical location topology: Store ➔ Zone/Room ➔ Rack ➔ Shelf ➔ Bin.
- Batch-level physical allocation: (Org, Store, Product, Batch, Location, Qty).
- Real-time stock lookup engine (search by salt, brand, barcode, SKU, or shelf code).
- FEFO (First Expiry, First Out) batch selector.
- Inventory ledger recording all stock movements.

### Phase 2: Procurement & Fast POS Billing Counter
- Supplier management, purchase orders, goods receipt with batch creation & shelf binning.
- High-speed POS interface: Keyboard navigation, barcode scanning, instant shelf location display, batch picker.
- Split-payment counter (Cash, UPI QR, Cards), change calculator.
- Dual invoice generation: ESC/POS thermal receipt (58mm/80mm) and A4 GST tax invoice.
- Sales ledger, returns, credit notes, and cash session reconciliation.

### Phase 3: Owner Command Center & Analytics
- Multi-store consolidated executive dashboard: Real-time revenue, gross margin estimates, inventory valuation.
- Expiry risk heatmap (Expired, <30 days, <60 days, <90 days).
- Stockout alerts and explainable reorder suggestions.
- Daily cash drawer closing, variance tracking, and audit logging.

### Phase 4: Multi-Store Operations & Inter-Store Transfers
- Multi-outlet management (1 to 10+ stores).
- Inter-store stock transfer lifecycle: Request ➔ Approval ➔ In-Transit Reservation ➔ Dispatch ➔ Receipt & Reconciliation.
- Store-specific pricing and stock rules.

### Phase 5: Branded Customer Ordering Portal & Prescription Workflow
- Customer-facing mobile-first storefront (`/store/[slug]`).
- Medicine discovery, category browsing, search by salt/brand, cart, and delivery/pickup selection.
- Prescription upload engine (images/PDF) with patient notes.
- Pharmacist verification queue: review prescription, approve/reject items, link to registered pharmacist license.
- Real-time order tracking timeline.

### Phase 6: Integrations, Adapters & Communications
- Payment gateway adapter (Razorpay/Cashfree sandbox/mockable).
- WhatsApp & SMS notification provider interfaces and event-driven triggers.
- Thermal ESC/POS printer driver/formatting utilities and barcode generator.

### Phase 7: Commercial SaaS & Subscription Entitlements
- Subscription tier engine: Solo, Growth, Chain tiers.
- Feature gating, store limits, and billing lifecycle.
- Super Admin platform console (`/admin`).

### Phase 8: Verification, Hardening & Production Readiness
- Comprehensive automated test suite passing unit, integration, and flow checks.
- Realistic Indian pharmacy seed dataset with verified clinical metadata.
- Performance audit, linting, production build verification, and deployment guides.
