import prisma from "@/lib/prisma";
import { Layers, Printer, Plus, Thermometer, ShieldAlert, Tag, CheckCircle2 } from "lucide-react";

export default async function ShelvesManagementPage() {
  const defaultStore = await prisma.store.findFirst({
    include: {
      locations: {
        include: {
          batchStock: {
            include: {
              batch: {
                include: { product: true },
              },
            },
          },
        },
        orderBy: { pickingOrder: "asc" },
      },
    },
  });

  const locations = defaultStore?.locations || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Physical Topology & Shelf Bin Architecture
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store ➔ Zone/Room ➔ Rack ➔ Shelf ➔ Bin hierarchy. Walk-sequence optimized picking path.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            Store: {defaultStore?.name || "Connaught Place (CP-01)"}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Configured Shelf Bins</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{locations.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Cold Chain Storage (2-8°C)</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {locations.filter((l) => l.temperatureControlled).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Locked / Controlled Rx Cabinets</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {locations.filter((l) => l.isRestricted).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total Binned Batches</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {locations.reduce((acc, l) => acc + l.batchStock.length, 0)}
          </div>
        </div>
      </div>

      {/* Shelf Locations Table with Label Printing */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            Active Store Physical Bins
          </h2>
          <span className="text-xs text-slate-500">
            Sorted by walk-sequence picking order
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Full Location Code</th>
                <th className="p-3">Zone / Room</th>
                <th className="p-3">Rack & Shelf</th>
                <th className="p-3">Bin Code</th>
                <th className="p-3 text-center">Picking Order</th>
                <th className="p-3">Attributes</th>
                <th className="p-3">Current Stock</th>
                <th className="p-3 text-center">Shelf Label</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locations.map((loc) => {
                const totalUnits = loc.batchStock.reduce((acc, bs) => acc + bs.quantity, 0);
                return (
                  <tr key={loc.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-mono font-bold text-slate-900 text-sm">{loc.fullCode}</div>
                    </td>
                    <td className="p-3 text-slate-700">{loc.zone}</td>
                    <td className="p-3 text-slate-600">
                      <div>{loc.rack}</div>
                      <div className="text-[10px] text-slate-400">{loc.shelf}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{loc.bin}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-700">
                      #{loc.pickingOrder}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {loc.temperatureControlled && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Thermometer className="w-3 h-3" />
                            Cold 2-8°C
                          </span>
                        )}
                        {loc.isRestricted && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <ShieldAlert className="w-3 h-3" />
                            Locked
                          </span>
                        )}
                        {!loc.temperatureControlled && !loc.isRestricted && (
                          <span className="text-[10px] text-slate-400">Ambient</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {loc.batchStock.length === 0 ? (
                        <span className="text-slate-400 italic">Empty</span>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-900">{totalUnits} units</div>
                          <div className="text-[10px] text-slate-500">
                            {loc.batchStock.map((b) => b.batch.product.brandName).join(", ")}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-block p-1.5 bg-slate-50 border border-slate-300 rounded font-mono text-[9px] text-slate-700 shadow-xs">
                        <div className="font-extrabold">{loc.fullCode}</div>
                        <div className="text-[8px] text-slate-400 uppercase">Scan QR / Barcode</div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
