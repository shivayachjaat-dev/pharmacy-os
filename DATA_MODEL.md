# DATA_MODEL.md — Relational Data Model Specification

## 1. Domain Entities & Schema Overview

The relational model is designed with strict multi-tenancy (`OrganizationId`), store-scoped operations (`StoreId`), physical topology mapping, batch tracking, financial ledgers, and regulatory safeguards.

---

## 2. Entity Groups

### 2.1 Multi-Tenancy & Authorization
- **`Organization`**: Multi-tenant boundary (e.g. "Apollo Medicos", "Sanjivani Pharmacy Chain").
  - `id`, `name`, `slug`, `gstin`, `dlNumber` (Drug License), `logoUrl`, `brandColor`, `createdAt`.
- **`Store`**: Physical pharmacy branch (1 to 10+).
  - `id`, `organizationId`, `name`, `code`, `address`, `phone`, `email`, `dlNumber`, `gstin`, `isActive`.
- **`User`**: System user (Owner, Manager, Pharmacist, Cashier, Picker, Admin).
  - `id`, `email`, `phone`, `name`, `passwordHash`, `role`, `pharmacistRegNo` (Council reg number), `createdAt`.
- **`StoreAssignment`**: Maps users to stores with store-level permission overrides.

### 2.2 Product Master & Catalogue
- **`Product`**: Medical SKU definition.
  - `id`, `organizationId`, `name`, `brandName`, `genericName`, `manufacturer`, `dosageForm` (Tablet, Syrup, Injection, Ointment, etc.), `strength` (e.g. 650mg, 500mg), `packSize` (e.g. 10 tablets/strip), `unitsPerPack` (10), `hsnCode`, `gstRate` (0, 5, 12, 18), `schedule` (`OTC`, `SCHEDULE_H`, `SCHEDULE_H1`, `SCHEDULE_X`, `NARCOTIC`), `storageType` (`ROOM_TEMP`, `COLD_STORAGE_2_8C`, `COOL_PLACE`), `requiresPrescription` (boolean), `mrp`, `sellingPrice`, `reorderLevel`, `barcode`, `isActive`.
- **`Category`**: Category taxonomy (e.g. Antibiotics, Antipyretics, Cardiac, Gastro, Baby Care).

### 2.3 Shelf Intelligence (Physical Hierarchy)
- **`Location`**: Configurable physical location within a store.
  - `id`, `storeId`, `zone`, `rack`, `shelf`, `bin`, `fullCode` (e.g. "GF/R-01/S-02/B-03"), `pickingOrder` (numeric sort key for optimal walk path), `temperatureControlled` (boolean), `isActive`.

### 2.4 Batches, Stock & Physical Allocation
- **`Batch`**: Specific manufacturer batch with expiry date.
  - `id`, `productId`, `storeId`, `batchNumber`, `expiryDate`, `mfgDate`, `purchaseCost`, `mrp`, `sellingPrice`, `supplierId`, `status` (`ACTIVE`, `QUARANTINED`, `EXPIRED`, `RECALLED`).
- **`BatchLocationStock`**: Physical placement of batch units on shelves.
  - `id`, `batchId`, `locationId`, `quantity` (Units in this specific shelf bin).
- **`InventoryLedgerEntry`**: Immutable transaction log for every single stock mutation.
  - `id`, `organizationId`, `storeId`, `batchId`, `locationId`, `movementType` (`PURCHASE_RECEIPT`, `SALE`, `SALE_RETURN`, `TRANSFER_OUT`, `TRANSFER_IN`, `ADJUSTMENT`, `EXPIRED_DISPOSAL`), `quantityDelta`, `reason`, `referenceId` (SaleId, PoId, TransferId), `userId`, `createdAt`.

### 2.5 Procurement & Suppliers
- **`Supplier`**: Drug distributor / wholesaler.
  - `id`, `organizationId`, `name`, `contactPerson`, `phone`, `email`, `gstin`, `dlNumber`, `address`, `paymentTerms`.
- **`PurchaseOrder`**: PO header.
  - `id`, `organizationId`, `storeId`, `supplierId`, `poNumber`, `status` (`DRAFT`, `ORDERED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`), `totalAmount`, `notes`, `createdAt`.
- **`PurchaseOrderItem`**: Line items of PO.
- **`GoodsReceipt`**: Receiving record when stock physically arrives, creating batches and allocating them to shelf locations.

### 2.6 Point of Sale & Billing
- **`Sale`**: POS invoice header.
  - `id`, `organizationId`, `storeId`, `invoiceNumber`, `customerName`, `customerPhone`, `doctorName`, `doctorRegNo`, `totalAmount`, `discountAmount`, `taxAmount`, `netAmount`, `paymentStatus`, `paymentMethod` (`CASH`, `UPI`, `CARD`, `SPLIT`, `CREDIT`), `cashierId`, `verifiedByPharmacistId`, `createdAt`.
- **`SaleItem`**: Sold products with batch linkage.
  - `id`, `saleId`, `productId`, `batchId`, `quantity`, `unitPrice`, `mrp`, `discount`, `gstRate`, `taxAmount`, `total`.
- **`SalePayment`**: Split tender records (cash received, change returned, UPI transaction ID).

### 2.7 Inter-Store Transfers
- **`StockTransfer`**:
  - `id`, `organizationId`, `fromStoreId`, `toStoreId`, `transferNumber`, `status` (`REQUESTED`, `APPROVED`, `DISPATCHED_IN_TRANSIT`, `RECEIVED`, `REJECTED`), `createdById`, `receivedById`, `notes`.
- **`StockTransferItem`**: Items with `batchId`, `quantity`, source shelf and destination shelf.

### 2.8 Customer Storefront & Online Orders
- **`Customer`**: Registered consumer profile.
  - `id`, `organizationId`, `phone`, `name`, `email`, `passwordHash`.
- **`CustomerAddress`**: Saved delivery locations.
- **`Prescription`**: Uploaded Rx document.
  - `id`, `customerId`, `orderId`, `fileUrl`, `fileName`, `status` (`PENDING_REVIEW`, `APPROVED`, `REJECTED`), `reviewedById` (Pharmacist user ID), `reviewNotes`, `reviewedAt`.
- **`OnlineOrder`**: Customer order header.
  - `id`, `organizationId`, `storeId`, `customerId`, `orderNumber`, `status` (`PLACED`, `AWAITING_PRESCRIPTION_REVIEW`, `CONFIRMED`, `PICKING`, `PACKED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`), `fulfillmentType` (`PICKUP`, `DELIVERY`), `deliveryAddress`, `totalAmount`, `paymentStatus`, `paymentMethod`.
- **`OnlineOrderItem`**: Order items and allocated batches.

### 2.9 SaaS Administration & Subscriptions
- **`Subscription`**: Tenant plan details.
  - `id`, `organizationId`, `plan` (`SOLO`, `GROWTH`, `CHAIN`), `maxStores`, `status` (`TRIAL`, `ACTIVE`, `PAST_DUE`, `CANCELLED`), `expiresAt`.
