# SECURITY.md — Security & Healthcare Data Privacy Architecture

## 1. Regulatory Context & Compliance
PharmacyOS handles sensitive health-related data, prescription documents, doctor recommendations, and financial transactions. As a pharmacy software operating in India, the application adheres to:
- **Drugs and Cosmetics Act, 1940 & Rules, 1945**: Strict controls on Schedule H, H1, X, and Narcotic drugs.
- **Pharmacy Act, 1948**: Regulated dispensing by registered pharmacists.
- **Digital Personal Data Protection (DPDP) Act, 2023**: Consent management, purpose limitation, and storage safeguards.
- **GST Statutory Auditing**: Non-destructible, sequential invoice numbers and tax audit ledgers.

---

## 2. Authentication & Authorization Architecture

### 2.1 Role-Based Access Control (RBAC)
The system enforces 8 explicit roles:
1. `SUPER_ADMIN`: SaaS platform administrator with cross-tenant diagnostics.
2. `ORG_OWNER`: Ultimate tenant owner (full control over org, stores, finances, billing).
3. `STORE_MANAGER`: Day-to-day store operations, stock audits, purchasing approvals.
4. `REGISTERED_PHARMACIST`: Legally licensed to review prescriptions, verify Schedule H/H1/X dispensing, and sign off orders.
5. `CASHIER`: Fast POS operations, barcode scanning, payment collection (restricted from viewing cost prices or modifying taxes).
6. `INVENTORY_STAFF`: Receiving goods, shelf allocations, inter-store transfers.
7. `PICKER_DELIVERY`: Order pick list execution and local delivery confirmation.
8. `CUSTOMER`: End consumer accessing branded storefront.

### 2.2 Tenant & Store Data Isolation
- Every relational query enforces tenant boundaries (`organizationId`).
- Store personnel are limited to their assigned `storeId` unless granted cross-store permissions.

---

## 3. Data Protection & File Storage

### 3.1 Prescription Document Privacy
- Prescription files uploaded by customers are saved with randomized non-guessable identifiers.
- Direct URL listing is disabled. Access to prescription files requires authentication and role verification (`REGISTERED_PHARMACIST`, `STORE_MANAGER`, `ORG_OWNER`, or the owning `CUSTOMER`).
- Patient diagnostic and prescription details are never leaked in public logs or marketing messages.

### 3.2 Audit Logging
- Material actions (price overrides, prescription reviews, stock write-offs, invoice cancellations) generate immutable `AuditLog` records containing:
  - User ID, role, action, target entity, previous state, new state, IP address, and timestamp.

---

## 4. Input Validation & Defense in Depth
- All inputs are strictly validated via Zod schemas before hitting business services.
- SQL injection is prevented through parameterized ORM queries (Prisma).
- Cross-Site Scripting (XSS) is mitigated by React's automatic HTML escaping.
- CSRF tokens and secure HTTP headers are applied across all state-mutating requests.
