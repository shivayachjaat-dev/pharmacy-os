# TASKS.md — Project Task Tracker

This tracker follows the lifecycle: `Backlog` ➔ `Ready` ➔ `In Progress` ➔ `Blocked` ➔ `Implemented` ➔ `Verified`.

---

## Active & Planned Tasks

### Phase 0: Foundation & Environment Setup
- [x] **TASK-001**: Inspect runtime, package managers, database tools, and git state. `[Verified]`
- [x] **TASK-002**: Generate core project documentation (`README.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `SECURITY.md`, etc.). `[Verified]`
- [x] **TASK-003**: Initialize Next.js 15 project with TypeScript, Tailwind CSS, Lucide Icons, and Prisma ORM. `[Verified]`
- [x] **TASK-004**: Configure Prisma schema with multi-tenancy, stores, shelf locations, products, batches, sales, and prescriptions. `[Verified]`
- [x] **TASK-005**: Set up Vitest test runner and write base schema and tenant boundary tests. `[Verified]`

### Phase 1: Product Master & Shelf Intelligence
- [x] **TASK-101**: Implement Product Catalogue model, services, and management screens (Generic salts, brands, schedules, GST, HSN). `[Verified]`
- [x] **TASK-102**: Implement 5-tier Shelf Intelligence (Store ➔ Zone ➔ Rack ➔ Shelf ➔ Bin) management and label printing. `[Verified]`
- [x] **TASK-103**: Implement Batch-Location stock allocation and FEFO sorting engine. `[Verified]`
- [x] **TASK-104**: Implement Instant Stock Lookup (search by salt, brand, barcode, SKU, or shelf code). `[Verified]`
- [x] **TASK-105**: Implement Expiry management center with 30/60/90 day alerts and expired-batch lock. `[Verified]`

### Phase 2: Procurement & POS Counter
- [x] **TASK-201**: Implement Supplier directory, Purchase Orders, and Goods Receiving with shelf binning. `[Verified]`
- [x] **TASK-202**: Implement fast POS billing interface (Keyboard shortcuts, barcode search, instant shelf display). `[Verified]`
- [x] **TASK-203**: Implement POS split-tender payment (Cash change calculator, UPI, Card) and GST calculation. `[Verified]`
- [x] **TASK-204**: Implement 58mm/80mm thermal receipt generator and A4 GST tax invoice view. `[Verified]`
- [x] **TASK-205**: Implement Sales returns, credit notes, and immutable inventory ledger updates. `[Verified]`

### Phase 3: Owner Command Center & Analytics
- [x] **TASK-301**: Implement consolidated Owner Dashboard (Sales, gross margin estimate, inventory valuation, stockout risks). `[Verified]`
- [x] **TASK-302**: Implement Cash session management (Opening float, closing reconciliation, cash variance). `[Verified]`
- [x] **TASK-303**: Implement Audit logs and statutory report views. `[Verified]`

### Phase 4: Multi-Store Operations
- [x] **TASK-401**: Implement Multi-store management (Store switcher, branch settings, user assignments). `[Verified]`
- [x] **TASK-402**: Implement Inter-store stock transfer workflow (Request ➔ Approval ➔ In-Transit ➔ Receipt & Ledger). `[Verified]`

### Phase 5: Branded Customer Ordering Portal
- [x] **TASK-501**: Implement branded customer storefront (`/store/[slug]`) with mobile-first medicine catalog search. `[Verified]`
- [x] **TASK-502**: Implement customer shopping cart, pickup/delivery checkout, and address selection. `[Verified]`
- [x] **TASK-503**: Implement prescription upload engine (image/PDF) with secure storage. `[Verified]`
- [x] **TASK-504**: Implement Pharmacist Verification Queue (Review prescription, approve/reject items, enter pharmacist license). `[Verified]`
- [x] **TASK-505**: Implement Visual Pick List for staff sorted by physical shelf walking sequence. `[Verified]`
- [x] **TASK-506**: Implement Customer Order Tracking timeline. `[Verified]`

### Phase 6: Integrations & Adapters
- [x] **TASK-601**: Implement Payment Gateway Adapter (Razorpay/Cashfree sandbox + mock mode). `[Verified]`
- [x] **TASK-602**: Implement Notification Adapter (WhatsApp & SMS event triggers). `[Verified]`

### Phase 7: SaaS Subscriptions & Platform Admin
- [x] **TASK-701**: Implement Subscription plan manager (Solo, Growth, Chain) and store limits. `[Verified]`
- [x] **TASK-702**: Implement Super Admin console (`/admin`). `[Verified]`

### Phase 8: Verification & Comprehensive Seed Data
- [x] **TASK-801**: Create rich Indian pharmacy seed dataset (Realistic medications, Schedule H/H1/OTC, fictional batches, physical locations, suppliers, sales). `[Verified]`
- [x] **TASK-802**: Execute end-to-end automated test suite (Unit, Integration, Workflow verification). `[Verified]`
- [x] **TASK-803**: Production build verification and final release review. `[Verified]`
