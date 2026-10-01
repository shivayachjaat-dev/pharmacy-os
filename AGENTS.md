# AGENTS.md — Autonomous Agent Operating Directives

This document outlines the protocol, architectural contracts, and operational guidelines for autonomous and semi-autonomous coding agents operating on the **PharmacyOS** codebase.

---

## 1. Primary Objectives
1. Maintain system stability, data integrity, and strict tenant boundaries across every commit and code modification.
2. Ensure that pharmacy-specific regulatory safeguards (prescription requirements, Schedule H/H1/X compliance, batch tracking, FEFO enforcement) are never bypassed or mocked away.
3. Keep code modular, testable, and strictly typed in TypeScript.
4. Adhere to the continuous implementation loop outlined in the system directives:
   `Inspect ➔ Plan ➔ Implement ➔ Test & Verify ➔ Document ➔ Iterate`.

---

## 2. Engineering Conventions & Invariants

### 2.1 Tenant and Store Isolation
- **Rule**: Every query that touches tenant data must filter by `organizationId`. Every store-scoped operation must validate `storeId` belonging to that `organizationId`.
- Never trust client-provided IDs without verifying current session ownership.

### 2.2 Financial & Inventory Consistency
- **Rule**: Stock movements must be recorded in an immutable ledger (`InventoryLedgerEntry`). Never directly overwrite stock without an audit entry or transaction.
- Sales, returns, and purchase receipts must execute inside an ACID transaction (`prisma.$transaction`).
- Currency values must be treated in fixed-precision subunits or standard decimals (INR ₹ with 2 decimal places).

### 2.3 Regulatory & Safety Guards
- Any sale or online order containing **Schedule H, H1, or X** medicines requires an approved prescription record associated with a registered pharmacist's ID (`verifiedByPharmacistId`).
- Expired or quarantined batches must strictly fail validation at checkout and billing.

### 2.4 Code Style & Organization
- Use Next.js App Router conventions:
  - `src/app/(app)/...`: Authenticated staff & owner operations
  - `src/app/(storefront)/store/[slug]/...`: Customer-facing web portal
  - `src/app/(admin)/admin/...`: Platform super-administration
  - `src/app/api/...`: REST and webhook API endpoints
  - `src/lib/...`: Shared domain services, database client, auth, utilities
  - `src/components/...`: Modular UI components
  - `src/types/...`: TypeScript domain types and schemas
- Keep business logic in domain service modules (`src/lib/services/...`) rather than bloated inline route handlers or client components.

---

## 3. Maintenance of Project Tracker
Agents must keep `TASKS.md` updated with exact task statuses:
- `Backlog`, `Ready`, `In Progress`, `Blocked`, `Implemented`, `Verified`.
- A task is only moved to `Verified` once automated tests confirm both positive and failure edge cases.
