import prisma from "@/lib/prisma";
import { CircleDollarSign, Plus, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

export default async function CashSessionPage() {
  const store = await prisma.store.findFirst();
  const sales = await prisma.sale.findMany({
    where: { paymentMethod: "CASH" },
  });

  const totalCashCollected = sales.reduce((acc, s) => acc + s.netAmount, 0);
  const openingFloat = 2000.0;
  const expectedInDrawer = openingFloat + totalCashCollected;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-emerald-600" />
            Cash Drawer Float & Session Closing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Opening cash float, real-time cash collections, day-end physical count, and variance auditing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            Store: {store?.name || "Connaught Place (CP-01)"}
          </span>
        </div>
      </div>

      {/* Cash Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-medium text-slate-500">Opening Cash Float</div>
          <div className="text-2xl font-black text-slate-900">{formatINR(openingFloat)}</div>
          <div className="text-[11px] text-slate-400">Recorded at 09:00 AM shift start</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-medium text-slate-500">Cash Sales Collected</div>
          <div className="text-2xl font-black text-emerald-600">{formatINR(totalCashCollected)}</div>
          <div className="text-[11px] text-emerald-700 font-semibold">{sales.length} cash bills today</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-medium text-slate-500">Expected in Drawer</div>
          <div className="text-2xl font-black text-slate-900">{formatINR(expectedInDrawer)}</div>
          <div className="text-[11px] text-slate-500">System calculated balance</div>
        </div>
      </div>

      {/* Shift Closing Action Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-xl">
        <h2 className="font-bold text-slate-900 text-sm">
          Perform Shift End Closing & Cash Count
        </h2>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Physical Cash Count in Drawer (₹)
            </label>
            <input
              type="number"
              defaultValue={expectedInDrawer}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Closing Notes / Variance Reason (if any)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. All currency verified, no discrepancies"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <button
            type="button"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Close Cash Drawer & Generate Day-End Summary
          </button>
        </div>
      </div>
    </div>
  );
}
