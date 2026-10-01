import { InventoryService } from "@/lib/services/inventory-service";
import prisma from "@/lib/prisma";
import { formatINR, formatDate } from "@/lib/utils";
import { Clock, AlertTriangle, ShieldAlert, CheckCircle2, Layers, Ban } from "lucide-react";

export default async function ExpiryCenterPage() {
  const store = await prisma.store.findFirst();
  const storeId = store?.id || "store-cp-main";

  const riskReport = await InventoryService.getExpiryRiskReport(storeId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Batch & Expiry Risk Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical-grade expiry monitoring with FEFO prioritization and supplier return windows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            Store: {store?.name || "Connaught Place (CP-01)"}
          </span>
        </div>
      </div>

      {/* Financial Exposure Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-red-50/70 p-4 rounded-xl border border-red-200 shadow-sm">
          <div className="text-xs font-bold text-red-800 flex items-center gap-1.5">
            <Ban className="w-4 h-4 text-red-600" />
            Expired Stock Liability
          </div>
          <div className="text-2xl font-black text-red-900 mt-1">
            {formatINR(riskReport.totalExpiredLossValue)}
          </div>
          <div className="text-[11px] text-red-700 mt-0.5">
            {riskReport.expired.length} batches strictly locked from sale
          </div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-sm">
          <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Critical & Near Expiry (&lt;60d)
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {formatINR(riskReport.totalAtRiskValue)}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            {riskReport.critical30Days.length + riskReport.nearExpiry60Days.length} batches requiring clearance
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Warning (60 - 90 Days)</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {riskReport.warning90Days.length} <span className="text-sm font-normal text-slate-400">batches</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Eligible for supplier credit note</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Healthy Stock (&gt;90 Days)</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {riskReport.safe.length} <span className="text-sm font-normal text-slate-400">batches</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">FEFO stock rotation healthy</div>
        </div>
      </div>

      {/* Near Expiry Batches List (< 60 Days) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Near Expiry Action Queue (&lt; 60 Days)
          </h2>
          <span className="text-xs text-slate-500">
            Physical shelf bins identified for fast pull-down
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Medicine & Brand</th>
                <th className="p-3">Batch #</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3">Days Left</th>
                <th className="p-3">Physical Shelf Bin</th>
                <th className="p-3 text-right">Units</th>
                <th className="p-3 text-right">Cost Value</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...riskReport.critical30Days, ...riskReport.nearExpiry60Days].length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    No batches expiring within the next 60 days.
                  </td>
                </tr>
              ) : (
                [...riskReport.critical30Days, ...riskReport.nearExpiry60Days].map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{b.productName}</div>
                      <div className="text-[10px] text-slate-500">{b.genericName}</div>
                    </td>
                    <td className="p-3 font-mono font-medium">{b.batchNumber}</td>
                    <td className="p-3 text-slate-700">{formatDate(b.expiryDate)}</td>
                    <td className="p-3 font-bold text-amber-700">
                      {b.daysLeft} days
                    </td>
                    <td className="p-3 font-mono text-emerald-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      {b.locations}
                    </td>
                    <td className="p-3 text-right font-bold">{b.units}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(b.lossValue)}
                    </td>
                    <td className="p-3 text-center">
                      <button className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-[11px] transition-colors">
                        Return to Supplier
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
