"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  Printer,
  ShieldAlert,
  CreditCard,
  QrCode,
  Banknote,
  Plus,
  Minus,
  CheckCircle,
  X,
  AlertTriangle,
  ArrowRight,
  Layers,
} from "lucide-react";
import { formatINR, formatDate, calculateGstBreakdown } from "@/lib/utils";
import { MEDICINE_SCHEDULES } from "@/lib/constants";

interface CartItem {
  productId: string;
  productName: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  schedule: string;
  requiresPrescription: boolean;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  locationId: string;
  shelfCode: string;
  quantity: number;
  availableQuantity: number;
  mrp: number;
  unitPrice: number;
  discountPercent: number;
  gstRate: number;
}

export default function PosBillingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Customer & Regulatory details
  const [customerName, setCustomerName] = useState("Counter Walk-in");
  const [customerPhone, setCustomerPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [prescriptionNumber, setPrescriptionNumber] = useState("");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [upiRef, setUpiRef] = useState("");

  // Modal & Finalized Invoice
  const [finalizedSale, setFinalizedSale] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount and F2 keypress
  useEffect(() => {
    searchInputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search medicines
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/inventory/lookup?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.items);
        }
      } catch (err) {
        console.error("Lookup error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check if cart contains any Schedule H / H1 / X drug
  const hasScheduledDrug = cart.some(
    (item) => item.schedule !== "OTC" || item.requiresPrescription
  );

  // Add medicine to cart
  const addToCart = (product: any, locationInfo: any) => {
    // Check if already in cart
    const existingIndex = cart.findIndex(
      (c) => c.batchId === locationInfo.batchNumber && c.locationId === locationInfo.locationId
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      if (updated[existingIndex].quantity < locationInfo.quantity) {
        updated[existingIndex].quantity += 1;
        setCart(updated);
      }
    } else {
      const newItem: CartItem = {
        productId: product.productId,
        productName: product.productName,
        genericName: product.genericName,
        dosageForm: product.dosageForm,
        strength: product.strength,
        schedule: product.schedule,
        requiresPrescription: product.requiresPrescription,
        batchId: locationInfo.batchId || locationInfo.batchNumber, // Fallback
        batchNumber: locationInfo.batchNumber,
        expiryDate: locationInfo.expiryDate,
        locationId: locationInfo.locationId,
        shelfCode: locationInfo.fullCode,
        quantity: 1,
        availableQuantity: locationInfo.quantity,
        mrp: product.mrp,
        unitPrice: product.sellingPrice,
        discountPercent: 0,
        gstRate: 12.0,
      };
      setCart([...cart, newItem]);
    }

    setSearchQuery("");
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const updated = [...cart];
    if (newQty <= updated[index].availableQuantity) {
      updated[index].quantity = newQty;
      setCart(updated);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Calculations
  const grossTotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const totalDiscount = (grossTotal * discountPercent) / 100;
  const netPayable = grossTotal - totalDiscount;

  const cashAmount = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashAmount - netPayable);

  // Checkout submission
  const handleFinalizeSale = async () => {
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage("Please add at least one medicine to the cart.");
      return;
    }

    if (hasScheduledDrug && !doctorName.trim()) {
      setErrorMessage("Prescribing Doctor's Name is legally required for Schedule H/H1 drugs.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Find org & store id or use default from backend
      const res = await fetch("/api/pos/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: "store-cp-main",
          customerName,
          customerPhone,
          doctorName: hasScheduledDrug ? doctorName : undefined,
          doctorRegNo: hasScheduledDrug ? doctorRegNo : undefined,
          prescriptionNumber: hasScheduledDrug ? prescriptionNumber : undefined,
          verifiedByPharmacistId: hasScheduledDrug ? "priya-pharmacist-id" : undefined, // Will map to registered pharmacist
          items: cart.map((item) => ({
            productId: item.productId,
            batchId: item.batchId,
            locationId: item.locationId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent,
          })),
          payment: {
            method: paymentMethod,
            amount: netPayable,
            cashTendered: paymentMethod === "CASH" ? cashAmount : undefined,
            changeReturned: paymentMethod === "CASH" ? changeDue : undefined,
            referenceNumber: paymentMethod === "UPI" ? upiRef : undefined,
          },
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMessage(data.error);
      } else {
        setFinalizedSale(data.sale);
        setCart([]);
        setCustomerName("Counter Walk-in");
        setCustomerPhone("");
        setDoctorName("");
        setDoctorRegNo("");
        setCashTendered("");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with POS Quick Stats & Regulatory Indicator */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            Retail Point of Sale (POS) Counter
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono text-slate-700">F2</kbd> or focus search for instant barcode/salt lookup with shelf guidance.
          </p>
        </div>

        {hasScheduledDrug ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-medium animate-pulse">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Schedule H/H1 Prescription Gate: Active (Doctor details required)
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Standard OTC Dispensing Mode
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)}>
            <X className="w-4 h-4 text-red-500 hover:text-red-700" />
          </button>
        </div>
      )}

      {/* Main Grid: Left (Search & Cart) vs Right (Customer & Tender) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Search & Cart Items */}
        <div className="lg:col-span-8 space-y-4">
          {/* Instant Search Bar */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan Barcode or Search Medicine by Brand, Generic Salt, or Shelf Code (e.g., 'Dolo', 'Paracetamol', 'GF/R-01')..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
              />
              {isSearching && (
                <div className="absolute right-4 text-xs font-medium text-slate-400 animate-pulse">
                  Searching...
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-96 overflow-y-auto z-40 divide-y divide-slate-100">
                {searchResults.map((product) => (
                  <div key={product.productId} className="p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{product.productName}</span>
                          <span className="text-xs text-slate-500">({product.genericName} • {product.strength})</span>
                          {product.schedule !== "OTC" && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              {product.schedule}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {product.dosageForm} • MRP: {formatINR(product.mrp)} • Selling: <span className="font-semibold text-emerald-700">{formatINR(product.sellingPrice)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-700">
                          Total Stock: {product.totalAvailableStock}
                        </span>
                      </div>
                    </div>

                    {/* Shelf Locations Breakdown */}
                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {product.locations.map((loc: any, lIdx: number) => (
                        <button
                          key={lIdx}
                          disabled={loc.isExpired || loc.quantity <= 0}
                          onClick={() => addToCart(product, loc)}
                          className="flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all text-xs disabled:opacity-50 disabled:pointer-events-none group"
                        >
                          <div>
                            <div className="font-mono font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-emerald-600" />
                              {loc.fullCode}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Batch: {loc.batchNumber} • Exp: {formatDate(loc.expiryDate)} ({loc.daysLeft}d left)
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-600">{loc.quantity} avail</span>
                            <div className="text-[10px] text-slate-400 group-hover:text-emerald-600 font-medium">Click to add</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                Cart Items
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                  {cart.length} items
                </span>
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-300" />
                <p className="text-sm font-medium">Cart is currently empty</p>
                <p className="text-xs mt-1">Scan a barcode or use the search bar above to begin billing.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Medicine & Salt</th>
                      <th className="p-3">Shelf Location</th>
                      <th className="p-3">Batch & Exp</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="text-[10px] text-slate-500">{item.genericName} • {item.strength}</div>
                          {item.schedule !== "OTC" && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded">
                              {item.schedule}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-medium text-emerald-700">
                          {item.shelfCode}
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-slate-800">{item.batchNumber}</div>
                          <div className="text-[10px] text-slate-500">{formatDate(item.expiryDate)}</div>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatINR(item.unitPrice)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => updateQuantity(idx, item.quantity - 1)}
                              className="w-6 h-6 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(idx, item.quantity + 1)}
                              className="w-6 h-6 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-100"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          {formatINR(item.quantity * item.unitPrice)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => removeFromCart(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Regulatory Details & Payment */}
        <div className="lg:col-span-4 space-y-4">
          {/* Customer & Statutory Doctor Section */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Customer & Prescription Record
            </h3>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Customer Mobile</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {hasScheduledDrug && (
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 space-y-2.5">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  Prescription Mandate (Schedule H/H1)
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-900 block mb-1">
                    Doctor's Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. K. S. Sharma, MD"
                    className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-amber-900 block mb-1">Doctor Reg #</label>
                    <input
                      type="text"
                      value={doctorRegNo}
                      onChange={(e) => setDoctorRegNo(e.target.value)}
                      placeholder="DMC-12345"
                      className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-amber-900 block mb-1">Rx Ref #</label>
                    <input
                      type="text"
                      value={prescriptionNumber}
                      onChange={(e) => setPrescriptionNumber(e.target.value)}
                      placeholder="RX-091"
                      className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment & Final Checkout */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Payment & Settlement
            </h3>

            {/* Payment Method Toggle */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === "CASH"
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <Banknote className="w-4 h-4" />
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === "UPI"
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <QrCode className="w-4 h-4" />
                UPI QR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === "CARD"
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Card POS
              </button>
            </div>

            {/* Cash Tender Calculation */}
            {paymentMethod === "CASH" && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Cash Received (₹)</label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder="0.00"
                    className="w-28 text-right font-mono font-bold text-slate-900 border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                {cashAmount > 0 && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="font-semibold text-slate-600">Change Due:</span>
                    <span className={`font-mono font-bold text-sm ${changeDue >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {formatINR(changeDue)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* UPI Ref */}
            {paymentMethod === "UPI" && (
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">UPI Ref / UTR #</label>
                <input
                  type="text"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  placeholder="e.g. 423458921820"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Gross)</span>
                <span>{formatINR(grossTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 items-center">
                <span>Discount (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="w-16 text-right font-mono text-xs border border-slate-200 rounded px-1.5 py-0.5"
                />
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount Amount</span>
                  <span>- {formatINR(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Net Payable:</span>
                <span className="text-emerald-700">{formatINR(netPayable)}</span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={handleFinalizeSale}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md hover:shadow-emerald-700/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <span>Generating Invoice & Deducting Stock...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Finalize Sale & Print Bill ({formatINR(netPayable)})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Finalized Modal & Printable Receipt */}
      {finalizedSale && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Sale Finalized Successfully!
              </div>
              <button
                onClick={() => setFinalizedSale(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ESC/POS Thermal Receipt Layout (58mm/80mm style) */}
            <div
              id="printable-receipt"
              className="bg-slate-50 border border-slate-200 p-4 rounded-lg font-mono text-xs text-slate-900 space-y-3"
            >
              <div className="text-center space-y-0.5">
                <div className="font-extrabold text-sm">{finalizedSale.store?.name || "Apollo Medicos"}</div>
                <div>{finalizedSale.store?.address || "Connaught Place, New Delhi"}</div>
                <div>GSTIN: {finalizedSale.store?.gstin || "07AAAAA1234A1Z5"}</div>
                <div>DL #: {finalizedSale.store?.dlNumber || "DL-01-20B-9871"}</div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-0.5 text-[11px]">
                <div>Invoice #: <span className="font-bold">{finalizedSale.invoiceNumber}</span></div>
                <div>Date: {formatDate(finalizedSale.createdAt)}</div>
                <div>Customer: {finalizedSale.customerName}</div>
                {finalizedSale.doctorName && (
                  <div>Doctor: {finalizedSale.doctorName} {finalizedSale.doctorRegNo ? `(${finalizedSale.doctorRegNo})` : ""}</div>
                )}
                {finalizedSale.cashier && (
                  <div>Billed by: {finalizedSale.cashier.name}</div>
                )}
              </div>

              {/* Items */}
              <div className="border-t border-dashed border-slate-300 pt-2">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-300 font-bold">
                      <th>Item</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Rate</th>
                      <th className="text-right">Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {finalizedSale.items?.map((item: any, iIdx: number) => (
                      <tr key={iIdx}>
                        <td className="py-1">
                          <div className="font-bold">{item.product?.name}</div>
                          <div className="text-[10px] text-slate-500">B: {item.batch?.batchNumber}</div>
                        </td>
                        <td className="py-1 text-right">{item.quantity}</td>
                        <td className="py-1 text-right">{formatINR(item.unitPrice)}</td>
                        <td className="py-1 text-right font-bold">{formatINR(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-right text-[11px]">
                <div>Subtotal: {formatINR(finalizedSale.totalAmount)}</div>
                {finalizedSale.discountAmount > 0 && (
                  <div>Discount: - {formatINR(finalizedSale.discountAmount)}</div>
                )}
                <div>CGST + SGST: {formatINR(finalizedSale.taxAmount)}</div>
                <div className="font-extrabold text-sm border-t border-slate-300 pt-1">
                  Net Amount: {formatINR(finalizedSale.netAmount)}
                </div>
                <div className="text-[10px] text-slate-500">
                  Payment Mode: {finalizedSale.paymentMethod}
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-500">
                *** Get Well Soon! Keep this bill for statutory returns ***
              </div>
            </div>

            {/* Print Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Thermal Receipt (58/80mm)
              </button>
              <button
                type="button"
                onClick={() => setFinalizedSale(null)}
                className="py-2.5 px-5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
