import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian Rupees (INR ₹)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format standard readable dates (DD MMM YYYY)
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Check if a batch is expired relative to today
 */
export function isBatchExpired(expiryDate: string | Date): boolean {
  const exp = new Date(expiryDate);
  const now = new Date();
  // Strip time for clean date comparison
  exp.setHours(23, 59, 59, 999);
  return exp.getTime() < now.getTime();
}

/**
 * Calculate remaining days until batch expiry
 */
export function daysUntilExpiry(expiryDate: string | Date): number {
  const exp = new Date(expiryDate);
  const now = new Date();
  const diffTime = exp.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate GST component (CGST + SGST or IGST)
 * priceWithoutTax = total / (1 + rate / 100)
 */
export function calculateGstBreakdown(netAmount: number, gstRate: number) {
  const basePrice = netAmount / (1 + gstRate / 100);
  const totalTax = netAmount - basePrice;
  const halfTax = totalTax / 2;
  return {
    basePrice: Number(basePrice.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    cgst: Number(halfTax.toFixed(2)),
    sgst: Number(halfTax.toFixed(2)),
    gstRate,
  };
}
