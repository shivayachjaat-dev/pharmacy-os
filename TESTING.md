# TESTING.md — Quality Assurance & Test Strategy

## 1. Testing Philosophy
In a medical domain application, automated verification is essential. A bug in stock allocation, price computation, or expiry validation can lead to dispensing expired drugs or violating statutory drug regulations.

Our testing pyramid comprises:
1. **Unit Tests**: Domain services, pricing engines, FEFO batch selection, tax calculations, pack conversions, and permission gates.
2. **Integration Tests**: Database transactions, multi-store stock transfers, atomic sale finalization, and tenant isolation.
3. **End-to-End Tests**: Full user journeys (POS sale, Online prescription upload & pharmacist review, Goods receiving with shelf binning).

---

## 2. Test Suites & Coverage Focus

### 2.1 Domain Calculations
- **GST & HSN Tax Breakdown**: Verification that CGST + SGST (or IGST) matches calculated line totals without rounding drift.
- **Pack-to-Unit Conversions**: e.g., 1 strip of 10 tablets correctly handles loose dispensing vs full pack sales.
- **FEFO (First Expiry, First Out)**: Ensuring that older non-expired batches are suggested first.
- **Expiry Boundary Rules**: Stock expiring today or earlier is strictly blocked from POS sale and customer reservation.

### 2.2 Inventory Transactions
- **Atomic Sale Finalization**: POS checkout decrements batch-location stock and inserts immutable ledger entries atomically.
- **Stock Transfer In-Transit**: Dispatched items decrement source shelf stock, enter in-transit state, and only reach destination upon formal receipt.
- **Concurrent Reservations**: Multiple online orders attempting to reserve the last batch units are handled without overselling.

### 2.3 Regulatory & Prescription Workflows
- **Schedule H Dispensing**: POS rejection when dispensing Schedule H medicine without doctor details or pharmacist verification.
- **Prescription Review Transitions**: Verification that customer orders containing Rx items cannot transition to `CONFIRMED` until signed off by `REGISTERED_PHARMACIST`.

---

## 3. Running Tests
```bash
# Run unit and integration tests with Vitest
npm test

# Run tests with coverage
npm run test:coverage

# Run End-to-End tests
npm run test:e2e
```
