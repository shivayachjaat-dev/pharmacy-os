# PharmacyOS — Next-Generation Autonomous Pharmacy Operating System

PharmacyOS is a commercial-grade, multi-tenant pharmacy commerce and operations platform tailored specifically for the Indian pharmaceutical retail and multi-outlet market. It combines the deep regulatory, inventory, and point-of-sale operational rigor of modern healthcare systems with the fluid customer ordering and fulfillment experience of top-tier consumer apps.

---

## 🌟 Key Highlights & Core Differentiators

1. **Shelf Intelligence (Physical Topology Engine)**
   - Configurable 5-level spatial hierarchy: `Store` ➔ `Zone/Room` ➔ `Rack` ➔ `Shelf` ➔ `Bin`.
   - Batch-level physical allocation: distinct batches of the same SKU can reside in different physical bins (e.g. cold storage vs. front-dispense rack).
   - Real-time stock lookup by generic salt, brand name, barcode, SKU, or shelf code.
   - Algorithmic walk-sequence pick lists for customer orders and inter-store transfers.

2. **India-First Regulatory & Compliance Core**
   - Medicine scheduling controls: **Schedule H, H1, X, Narcotics, OTC**.
   - Mandatory registered pharmacist verification gate before dispensing regulated drugs.
   - Dual-pricing and statutory safeguards: MRP enforcement, GST rates (0%, 5%, 12%, 18%), HSN code auditing.
   - Digital prescription capture, tamper-evident audit logs, and pharmacist sign-off trails.

3. **High-Speed Point of Sale (POS)**
   - Keyboard-first, barcode-scanner-optimized billing designed for high-traffic Indian retail counters.
   - Automated FEFO (First Expiry, First Out) batch suggestion with instant shelf location display.
   - Dual receipting: 58mm/80mm thermal receipt printing (ESC/POS compatible layout) and formal A4 tax invoices.
   - Split tenders: Cash with change calculator, UPI QR, Cards, Credit Ledgers.

4. **Multi-Store & Chain Management (1 to 10+ Outlets)**
   - Multi-tenant architecture with strict tenant isolation.
   - Organization Owner Command Center with consolidated live P&L, stockout heatmaps, and expiry liabilities.
   - Inter-store stock transfer workflows: Request ➔ Approval ➔ In-Transit Reservation ➔ Destination Dispatch & Audit.

5. **Customer Ordering Portal (Branded Web Storefront)**
   - White-label mobile-first customer storefront per pharmacy organization (`/store/[slug]`).
   - Prescription upload (PDF/Images) with secure storage and pharmacist review workflow.
   - Live store inventory checking, Click & Collect (Pickup) or Local Delivery dispatch.
   - Real-time order progress timeline from submission to delivery.

6. **Platform Super Administration**
   - SaaS tier management (Solo, Growth, Chain), tenant onboarding, subscription entitlements, and system metrics.

---

## 🏗️ Architecture & Technology Stack

- **Framework**: Next.js 15 (App Router, Server Actions, API Route Handlers)
- **Language**: TypeScript 5+ (Strict mode)
- **Styling & Components**: Tailwind CSS with Radix UI / Lucide React design system
- **Database & ORM**: Prisma ORM with SQLite (embedded portable dev/test) and PostgreSQL compatibility for production
- **Validation**: Zod schema validation on client, API boundaries, and database models
- **Testing**: Vitest for unit & integration tests, Playwright for E2E browser tests

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd PharmacyApp

# Install dependencies
npm install

# Run database migrations and seed realistic Indian pharmacy dataset
npm run db:push
npm run db:seed

# Start the development server
npm run dev
```

Visit:
- **Internal Staff & Owner Portal**: `http://localhost:3000`
- **Customer Storefront**: `http://localhost:3000/store/apollo-health`
- **Platform Super Admin**: `http://localhost:3000/admin`

---

## 📖 System Documentation
- [Architecture & Tech Stack](./ARCHITECTURE.md)
- [Relational Data Model](./DATA_MODEL.md)
- [Project Plan & Roadmap](./PROJECT_PLAN.md)
- [Tasks & Implementation Status](./TASKS.md)
- [Security & Compliance Specification](./SECURITY.md)
- [Testing Strategy & Test Suite](./TESTING.md)
- [External Integrations](./INTEGRATIONS.md)
- [Production Deployment Guide](./DEPLOYMENT.md)
- [Changelog](./CHANGELOG.md)
- [Known Issues & Mitigations](./KNOWN_ISSUES.md)
- [Agents & Autonomous System Directives](./AGENTS.md)
