# INTEGRATIONS.md — External Integrations & Adapter Architecture

## 1. Integration Boundary Philosophy
External providers (payment gateways, WhatsApp Business API, SMS/Email delivery, ESC/POS hardware) are accessed through clean TypeScript interfaces and adapter patterns. 

Every adapter supports:
1. **Mock / Sandbox Mode**: Allows zero-config local testing and autonomous development without external paid credentials.
2. **Production Provider Mode**: Uses verified API keys, webhook signatures, and network retries.

---

## 2. Integrated Services

### 2.1 Online Payments (Razorpay / Cashfree)
- **Interface**: `PaymentGatewayAdapter`
- **Capabilities**:
  - `createPaymentOrder({ amount, currency, orderId, notes })`
  - `verifyWebhookSignature(payload, signature, secret)`
  - `initiateRefund({ paymentId, amount, reason })`
- **Status**: Complete with Mock Sandbox Adapter and Razorpay-compatible signatures.

### 2.2 Customer Notifications (WhatsApp Business & SMS)
- **Interface**: `NotificationAdapter`
- **Capabilities**:
  - `sendOrderConfirmation(phone, orderDetails)`
  - `sendPrescriptionReviewStatus(phone, orderId, approved, notes)`
  - `sendOutForDeliveryAlert(phone, trackingUrl)`
- **Status**: Implemented with development logger adapter and official Meta Cloud API interface.

### 2.3 Hardware & ESC/POS Printing
- **Interface**: `ReceiptPrinterAdapter`
- **Capabilities**:
  - Direct 58mm / 80mm thermal receipt generator (ESC/POS byte format and print-ready CSS).
  - A4 Tax Invoice PDF generation.
  - Barcode & Shelf QR code label generator.
- **Status**: Functional with browser print stylesheets and ESC/POS command sequences.
