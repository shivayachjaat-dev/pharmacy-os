"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Layers,
  CheckCircle2,
  Clock,
  FileCheck,
  Search,
  Check,
  X,
  MapPin,
  Phone,
  PackageCheck,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

export default function CustomerOrdersManagementPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPickList, setSelectedPickList] = useState<any | null>(null);
  const [pickListLoading, setPickListLoading] = useState(false);
  const [pickedItems, setPickedItems] = useState<Record<string, boolean>>({});

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openPickList = async (orderId: string) => {
    setPickListLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/pick-list`);
      const data = await res.json();
      if (data.success) {
        setSelectedPickList(data.pickList);
        setPickedItems({});
      }
    } catch (err) {
      console.error("Failed to load pick list:", err);
    } finally {
      setPickListLoading(false);
    }
  };

  const toggleItemPicked = (itemId: string) => {
    setPickedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        loadOrders();
        if (selectedPickList) {
          setSelectedPickList({ ...selectedPickList, status });
        }
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            Customer Orders & Shelf Pick Routing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store order fulfillment with walk-sequence optimized pick paths and pharmacist sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            Store: Connaught Place (CP-01)
          </span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">
            Active Online Orders ({orders.length})
          </h2>
          <button
            onClick={loadOrders}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Order Number</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Fulfillment</th>
                <th className="p-3">Items</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Shelf Pick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No online orders placed yet. Place an order through the customer storefront!
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{ord.customer.name}</div>
                      <div className="text-[10px] text-slate-500">{ord.customer.phone}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-700">{ord.fulfillmentType}</span>
                      {ord.deliveryAddress && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{ord.deliveryAddress}</div>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">
                      {ord.items.map((i: any) => `${i.product.name} (x${i.quantity})`).join(", ")}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800"
                            : ord.status === "AWAITING_PRESCRIPTION_REVIEW"
                            ? "bg-amber-100 text-amber-800"
                            : ord.status === "PICKING"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {ord.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900">
                      {formatINR(ord.totalAmount)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openPickList(ord.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Pick List
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Pick List Modal (Shelf Intelligence Engine) */}
      {selectedPickList && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  Visual Pick List — {selectedPickList.orderNumber}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Items automatically sorted by physical walking sequence ({selectedPickList.storeName})
                </p>
              </div>
              <button
                onClick={() => setSelectedPickList(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pick List Walk Path Table */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Store Walking Sequence
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedPickList.items.map((item: any, idx: number) => {
                  const isChecked = pickedItems[item.orderItemId] || item.isPicked;
                  return (
                    <div
                      key={item.orderItemId}
                      onClick={() => toggleItemPicked(item.orderItemId)}
                      className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                        isChecked ? "bg-emerald-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                            isChecked
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>

                        <div>
                          <div className={`font-bold text-sm ${isChecked ? "line-through text-slate-400" : "text-slate-900"}`}>
                            {item.productName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.dosageForm} • {item.strength} • Batch: <span className="font-mono font-medium text-slate-700">{item.recommendedBatch}</span>
                          </div>
                        </div>
                      </div>

                      {/* Exact Shelf Bin Coordinates */}
                      <div className="text-right">
                        <div className="font-mono font-extrabold text-sm text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                          {item.shelfCode}
                        </div>
                        <div className="text-xs font-bold text-slate-900 mt-1">
                          Qty: {item.quantityOrdered}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Transition Status Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Current Status: <span className="font-bold text-slate-900">{selectedPickList.status}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateOrderStatus(selectedPickList.orderId, "PICKING")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Mark Picking
                </button>
                <button
                  type="button"
                  onClick={() => updateOrderStatus(selectedPickList.orderId, "PACKED")}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
                >
                  Mark Packed
                </button>
                <button
                  type="button"
                  onClick={() => updateOrderStatus(selectedPickList.orderId, "OUT_FOR_DELIVERY")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                >
                  Dispatch / Ready
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
