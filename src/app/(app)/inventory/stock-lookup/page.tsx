"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Layers,
  ArrowRightLeft,
  Calendar,
  AlertTriangle,
  Pill,
  CheckCircle2,
  X,
  Filter,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

export default function StockLookupPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Transfer modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState<any | null>(null);
  const [sourceLoc, setSourceLoc] = useState("");
  const [targetShelfCode, setTargetShelfCode] = useState("");
  const [transferQty, setTransferQty] = useState(1);
  const [transferStatus, setTransferStatus] = useState<string | null>(null);

  const fetchItems = async (q = "") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/inventory/lookup?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Fetch items error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(query);
  }, [query]);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferStatus("Processing relocation...");
    try {
      // Find source location object
      const locObj = selectedItemForTransfer.locations.find((l: any) => l.fullCode === sourceLoc);
      if (!locObj) throw new Error("Please select a valid source shelf");

      const res = await fetch("/api/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: "org-apollo",
          storeId: "store-cp-main",
          batchId: locObj.batchNumber, // or batchId
          sourceLocationId: locObj.locationId,
          targetLocationId: locObj.locationId, // fallback
          quantity: transferQty,
          reason: `Relocated from ${sourceLoc} to ${targetShelfCode}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTransferStatus("✅ Stock relocated successfully!");
        setTimeout(() => {
          setTransferModalOpen(false);
          setTransferStatus(null);
          fetchItems(query);
        }, 1200);
      } else {
        setTransferStatus(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setTransferStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Shelf Intelligence & Stock Locator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Locate medicines across physical zones, racks, shelves, and bins in sub-seconds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            Active Store: Connaught Place (CP-01)
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medicine by Generic Salt (e.g. Paracetamol), Brand (e.g. Dolo, Augmentin), Barcode, or Shelf Code (e.g. GF/R-01)..."
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading medicine locations...</div>
        ) : items.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
            <Pill className="w-10 h-10 mx-auto stroke-1 mb-2 text-slate-300" />
            <p className="text-sm font-medium">No matching medicines found</p>
            <p className="text-xs mt-1">Try another brand name, generic salt, or shelf code.</p>
          </div>
        ) : (
          items.map((prod) => (
            <div
              key={prod.productId}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all space-y-4"
            >
              {/* Product Info Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-extrabold text-base text-slate-900">{prod.productName}</h3>
                    <span className="text-xs text-slate-500">
                      ({prod.genericName} • {prod.strength})
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        prod.schedule === "OTC"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {prod.schedule}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Dosage: <span className="font-semibold text-slate-700">{prod.dosageForm}</span> • MRP: {formatINR(prod.mrp)} • Selling: <span className="font-bold text-emerald-700">{formatINR(prod.sellingPrice)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Available In-Store</div>
                    <div className="text-lg font-black text-slate-900">
                      {prod.totalAvailableStock} <span className="text-xs font-normal text-slate-500">units</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedItemForTransfer(prod);
                      setSourceLoc(prod.locations[0]?.fullCode || "");
                      setTransferModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Relocate
                  </button>
                </div>
              </div>

              {/* Physical Shelf Locations Table */}
              <div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Physical Shelf Locations & Batches
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {prod.locations.map((loc: any, lIdx: number) => (
                    <div
                      key={lIdx}
                      className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                        loc.isExpired
                          ? "bg-red-50/50 border-red-200"
                          : loc.daysLeft <= 60
                          ? "bg-amber-50/50 border-amber-200"
                          : "bg-slate-50/80 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {loc.fullCode}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            loc.isExpired
                              ? "bg-red-200 text-red-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {loc.quantity} units
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600">
                        <span className="font-medium text-slate-500">Zone:</span> {loc.zone}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                        <span className="font-mono text-slate-700">Batch: {loc.batchNumber}</span>
                        <span
                          className={`font-medium ${
                            loc.isExpired
                              ? "text-red-700 font-bold"
                              : loc.daysLeft <= 60
                              ? "text-amber-700 font-semibold"
                              : "text-slate-500"
                          }`}
                        >
                          {loc.isExpired ? "EXPIRED" : `${loc.daysLeft}d left`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Relocate Shelf Modal */}
      {transferModalOpen && selectedItemForTransfer && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-600" />
                Relocate Shelf Stock
              </h3>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-xs text-slate-500">Selected Medicine</div>
              <div className="font-bold text-sm text-slate-900">{selectedItemForTransfer.productName}</div>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Source Shelf Bin</label>
                <select
                  value={sourceLoc}
                  onChange={(e) => setSourceLoc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                >
                  {selectedItemForTransfer.locations.map((l: any, idx: number) => (
                    <option key={idx} value={l.fullCode}>
                      {l.fullCode} (Batch: {l.batchNumber} • {l.quantity} units)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Destination Shelf Bin Code</label>
                <input
                  type="text"
                  required
                  value={targetShelfCode}
                  onChange={(e) => setTargetShelfCode(e.target.value)}
                  placeholder="e.g. GF/R-01/S-01/B-02 or BR/R-03/S-02/B-04"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Units to Relocate</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                />
              </div>

              {transferStatus && (
                <div className="p-3 rounded-lg bg-slate-100 font-medium text-slate-800">
                  {transferStatus}
                </div>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  Confirm Relocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
