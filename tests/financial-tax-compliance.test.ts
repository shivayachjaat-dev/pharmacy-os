import { describe, it, expect } from "vitest";
import { calculateGstBreakdown, formatINR, isBatchExpired, daysUntilExpiry } from "../src/lib/utils";

describe("Financial Integrity & Tax Compliance Test Suite", () => {
  it("should accurately calculate Indian GST (CGST + SGST) without rounding drift", () => {
    // Standard ₹100 MRP item with 12% GST
    const breakdown12 = calculateGstBreakdown(100, 12);
    expect(breakdown12.basePrice).toBe(89.29);
    expect(breakdown12.totalTax).toBe(10.71);
    expect(breakdown12.cgst).toBe(5.36);
    expect(breakdown12.sgst).toBe(5.36);
    expect(breakdown12.basePrice + breakdown12.totalTax).toBe(100);

    // ₹223.50 MRP item with 12% GST (Augmentin 625)
    const breakdownAug = calculateGstBreakdown(223.5, 12);
    expect(breakdownAug.basePrice).toBe(199.55);
    expect(breakdownAug.totalTax).toBe(23.95);
    expect(breakdownAug.basePrice + breakdownAug.totalTax).toBe(223.5);

    // Life-saving insulin: 5% GST
    const breakdownInsulin = calculateGstBreakdown(198.0, 5);
    expect(breakdownInsulin.basePrice).toBe(188.57);
    expect(breakdownInsulin.totalTax).toBe(9.43);
    expect(breakdownInsulin.cgst).toBe(4.71);
    expect(breakdownInsulin.sgst).toBe(4.71);
  });

  it("should format Indian Rupees (INR) with proper currency symbol and commas", () => {
    expect(formatINR(1234.5)).toBe("₹1,234.50");
    expect(formatINR(100000)).toBe("₹1,00,000.00"); // Indian numbering format: 1 Lakh
    expect(formatINR(34.5)).toBe("₹34.50");
  });

  it("should correctly determine batch expiry boundaries", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isBatchExpired(yesterday)).toBe(true);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    expect(isBatchExpired(futureDate)).toBe(false);
    expect(daysUntilExpiry(futureDate)).toBeGreaterThan(80);
  });
});
