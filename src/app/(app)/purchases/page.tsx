import prisma from "@/lib/prisma";
import { Sliders, Plus, Truck, Building, FileText, CheckCircle2 } from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

export default async function PurchasesPage() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      batches: true,
      purchaseOrders: true,
    },
  });

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: {
      supplier: true,
      store: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            Procurement, Suppliers & Goods Receiving
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage drug distributors, purchase orders, and goods receiving with batch creation & shelf binning.
          </p>
        </div>

        <button className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Create Purchase Order
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Building className="w-4 h-4 text-emerald-600" />
          Authorized Drug Distributors & Wholesalers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((s) => (
            <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {s.paymentTerms}
                </span>
              </div>
              <div className="text-xs text-slate-600">Contact: {s.contactPerson} • {s.phone}</div>
              <div className="text-[11px] font-mono text-slate-500">
                GSTIN: {s.gstin} • DL: {s.dlNumber}
              </div>
              <div className="text-xs text-slate-700 pt-1 border-t border-slate-200/80 flex justify-between">
                <span>Outstanding Balance:</span>
                <span className="font-bold text-slate-900">{formatINR(s.balanceAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Purchase Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Purchase Orders & Goods Inward Receipts
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">PO Number</th>
                <th className="p-3">Distributor</th>
                <th className="p-3">Store Branch</th>
                <th className="p-3">Ordered Items</th>
                <th className="p-3 text-right">Net Value</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No open purchase orders.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{po.poNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{po.supplier.name}</td>
                    <td className="p-3 text-slate-700">{po.store.name}</td>
                    <td className="p-3 text-slate-600">
                      {po.items.map((i) => i.product.name).join(", ")}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatINR(po.netAmount)}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {po.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] border border-emerald-300">
                        Receive & Bin
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
