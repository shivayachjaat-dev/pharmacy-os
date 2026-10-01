# KNOWN_ISSUES.md — Operational Limitations & Mitigations

This document tracks known limitations, pending upstream integrations, and documented technical trade-offs.

---

## 1. Upstream & Hardware Integrations

| Issue ID | Area | Description | Current Status / Mitigation |
| :--- | :--- | :--- | :--- |
| **KI-001** | Payment Gateways | Live Razorpay / Cashfree requires registered Indian merchant KYC and active API keys. | Mock/Sandbox adapter implemented for autonomous local verification. |
| **KI-002** | WhatsApp API | Meta Cloud API requires verified Meta Business Manager and approved HSM message templates. | Implemented development notification logger and compliant webhook contracts. |
| **KI-003** | Thermal ESC/POS | Direct raw USB/COM communication in browsers requires WebUSB / local printer agent. | High-performance CSS print layouts for 58mm/80mm thermal receipt formats with standard browser print dialog fallback. |

---

## 2. Regulatory & Legal Disclaimer
PharmacyOS provides software controls for batch tracking, expiry prevention, and pharmacist verification. However, software rules do not substitute for a qualified, licensed Indian pharmacist exercising statutory duties under the Pharmacy Act, 1948 and Drugs and Cosmetics Act, 1940.
