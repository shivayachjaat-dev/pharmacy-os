"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  UploadCloud,
  FileCheck,
  Truck,
  Store,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Phone,
  MapPin,
  Pill,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function StorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string || "apollo-health";

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Checkout states
  const [fulfillmentType, setFulfillmentType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD");

  // Prescription upload modal
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [rxDoctorName, setRxDoctorName] = useState("");
  const [rxPatientName, setRxPatientName] = useState("");
  const [rxFileName, setRxFileName] = useState("prescription-scan-01.jpg");
  const [rxUploaded, setRxUploaded] = useState(false);

  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // Load products
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch("/api/inventory/lookup");
        const data = await res.json();
        if (data.success) {
          setProducts(data.items);
          const cats = Array.from(new Set(data.items.map((i: any) => i.dosageForm))) as string[];
          setCategories(["All", ...cats]);
        }
      } catch (err) {
        console.error("Storefront catalog load failed:", err);
      }
    }
    loadCatalog();
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find((c) => c.product.productId === product.productId);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.product.productId === product.productId
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setCartOpen(true);
  };

  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(cart.filter((c) => c.product.productId !== productId));
    } else {
      setCart(
        cart.map((c) =>
          c.product.productId === productId ? { ...c, quantity: newQty } : c
        )
      );
    }
  };

  const subtotal = cart.reduce(
    (acc, item) => acc + item.quantity * item.product.sellingPrice,
    0
  );
  const deliveryFee = fulfillmentType === "DELIVERY" && subtotal > 0 ? 35 : 0;
  const grandTotal = subtotal + deliveryFee;

  const requiresPrescription = cart.some(
    (item) => item.product.requiresPrescription || item.product.schedule !== "OTC"
  );

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (requiresPrescription && !rxUploaded) {
      setRxModalOpen(true);
      return;
    }

    setOrderSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: "org-apollo",
          storeId: "store-cp-main",
          customerId: "cust-demo", // In real flow, customer auth ID
          fulfillmentType,
          deliveryAddress: fulfillmentType === "DELIVERY" ? deliveryAddress : undefined,
          paymentMethod,
          items: cart.map((c) => ({
            productId: c.product.productId,
            quantity: c.quantity,
          })),
          prescription: rxUploaded
            ? {
                doctorName: rxDoctorName,
                patientName: rxPatientName,
                fileName: rxFileName,
                fileUrl: "/uploads/prescriptions/" + rxFileName,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrderSuccess(data.order);
        setCart([]);
        setCartOpen(false);
      } else {
        alert("Failed to place order: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "All" || p.dosageForm === selectedCategory;
    const matchesQuery =
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.genericName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Branded Storefront Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              Rx
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-base tracking-tight leading-tight">
                Apollo Health Medicos
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-emerald-600" />
                Connaught Place • 24x7 Express Delivery
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-2 font-bold text-xs"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">My Cart</span>
              {cart.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Banner with Order Prescription CTA */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 max-w-xl">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              Verified Pharmacist On Call
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Order Genuine Medicines Online with Free Pharmacist Review
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100">
              Upload doctor's prescription for quick verification, or browse daily wellness and OTC essentials.
            </p>
          </div>

          <button
            onClick={() => setRxModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-white text-emerald-900 font-extrabold text-xs hover:bg-emerald-50 transition-all shadow-md flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4 text-emerald-600" />
            Upload Prescription (Rx)
          </button>
        </div>

        {/* Search & Category Pills */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Medicine Brand (e.g. Dolo, Augmentin, Pan) or Generic Salt (e.g. Paracetamol)..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p.productId}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      p.schedule === "OTC"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {p.schedule}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {p.dosageForm}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{p.productName}</h3>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {p.genericName} • {p.strength}
                </p>

                {p.requiresPrescription && (
                  <div className="mt-2 text-[10px] text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 font-medium flex items-center gap-1 border border-amber-200">
                    <FileCheck className="w-3 h-3 text-amber-600" />
                    Doctor Prescription Required
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 line-through">MRP {formatINR(p.mrp)}</div>
                  <div className="text-base font-extrabold text-slate-900">
                    {formatINR(p.sellingPrice)}
                  </div>
                </div>

                <button
                  onClick={() => addToCart(p)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Drawer & Checkout */}
      {cartOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl p-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  Your Medicine Cart ({cart.length})
                </h3>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingCart className="w-10 h-10 mx-auto stroke-1 mb-2 text-slate-300" />
                  <p className="text-sm">Your cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-3 divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.product.productId} className="pt-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{item.product.productName}</div>
                        <div className="text-[10px] text-slate-500">
                          {formatINR(item.product.sellingPrice)} each
                        </div>
                        {item.product.requiresPrescription && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded">
                            Rx Required
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQty(item.product.productId, item.quantity - 1)}
                          className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.product.productId, item.quantity + 1)}
                          className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Prescription Warning in Cart */}
              {requiresPrescription && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-amber-700" />
                    Prescription Required for this Order
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Indian pharmacy regulations require a valid doctor's prescription for scheduled drugs.
                  </p>
                  {rxUploaded ? (
                    <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Prescription attached ({rxFileName})
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRxModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                    >
                      Attach Prescription Now
                    </button>
                  )}
                </div>
              )}

              {/* Checkout Form */}
              {cart.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFulfillmentType("DELIVERY")}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 ${
                        fulfillmentType === "DELIVERY"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-slate-200 text-slate-700"
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Home Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillmentType("PICKUP")}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 ${
                        fulfillmentType === "PICKUP"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-slate-200 text-slate-700"
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      Store Pickup
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Sandeep Verma"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 99999 88888"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  {fulfillmentType === "DELIVERY" && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Delivery Address</label>
                      <textarea
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="House / Flat #, Apartment, Street, Pin Code..."
                        rows={2}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  )}

                  {/* Price Summary */}
                  <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>{formatINR(subtotal)}</span>
                    </div>
                    {fulfillmentType === "DELIVERY" && (
                      <div className="flex justify-between text-slate-600">
                        <span>Express Delivery Fee</span>
                        <span>{formatINR(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                      <span>Payable Total:</span>
                      <span className="text-emerald-700">{formatINR(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Order */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={orderSubmitting}
                  onClick={handlePlaceOrder}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {orderSubmitting ? "Placing Order..." : `Confirm Order (${formatINR(grandTotal)})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prescription Upload Modal */}
      {rxModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
                Upload Doctor's Prescription
              </h3>
              <button
                onClick={() => setRxModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Please provide prescription details for our registered pharmacist to verify before dispensing.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Prescribing Doctor's Name</label>
                <input
                  type="text"
                  value={rxDoctorName}
                  onChange={(e) => setRxDoctorName(e.target.value)}
                  placeholder="e.g. Dr. A. K. Sen, MD"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Name</label>
                <input
                  type="text"
                  value={rxPatientName}
                  onChange={(e) => setRxPatientName(e.target.value)}
                  placeholder="e.g. Sandeep Verma"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 p-6 rounded-xl text-center space-y-2 bg-slate-50">
                <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="font-semibold text-slate-800 text-xs">{rxFileName}</div>
                <div className="text-[10px] text-slate-400">PDF, JPG, PNG accepted (Max 10MB)</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRxUploaded(true);
                  setRxModalOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
              >
                Attach & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="font-extrabold text-slate-900 text-lg">Order Placed Successfully!</h3>
            <div className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 py-1 px-3 rounded-full inline-block">
              {orderSuccess.orderNumber}
            </div>

            <p className="text-xs text-slate-600">
              {orderSuccess.isPrescriptionOrder
                ? "Your order has been forwarded to our registered pharmacist for verification. You will receive an SMS when reviewed."
                : "Your order is confirmed and our store team is picking items from shelves."}
            </p>

            <button
              onClick={() => setOrderSuccess(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* Storefront Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div>
          © 2026 Apollo Health Medicos • Licensed Pharmacy DL-2024-DEL-98765 • Powered by PharmacyOS
        </div>
      </footer>
    </div>
  );
}
