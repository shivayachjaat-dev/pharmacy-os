import prisma from "@/lib/prisma";
import { ArrowLeftRight, Store, CheckCircle2, Clock, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function TransfersPage() {
  const transfers = await prisma.stockTransfer.findMany({
    include: {
      fromStore: true,
      toStore: true,
      items: {
        include: {
          batch: {
            include: { product: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
            Inter-Store Stock Transfers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Request, dispatch, and receive stock between pharmacy branches with in-transit reservation.
          </p>
        </div>

        <button className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          New Transfer Request
        </button>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900 text-sm">
            Active & Historical Transfers
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Transfer #</th>
                <th className="p-3">Source Store</th>
                <th className="p-3">Destination Store</th>
                <th className="p-3">Items & Batch</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No inter-store transfers initiated yet.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{t.transferNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{t.fromStore.name}</td>
                    <td className="p-3 font-semibold text-emerald-800">{t.toStore.name}</td>
                    <td className="p-3 text-slate-600">
                      {t.items.map((i) => `${i.batch.product.name} (B: ${i.batch.batchNumber})`).join(", ")}
                    </td>
                    <td className="p-3 text-center font-bold">
                      {t.items.reduce((acc, curr) => acc + curr.quantityRequested, 0)}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{formatDate(t.createdAt)}</td>
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
