import prisma from "@/lib/prisma";
import { Pill, Plus, Search, Filter, ShieldAlert, CheckCircle } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default async function ProductsCataloguePage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      batches: {
        where: { status: "ACTIVE" },
        include: {
          locationStock: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-emerald-600" />
            Medicine Master & Catalogue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard pharmaceutical product master with statutory schedules, GST slabs, and pack conversions.
          </p>
        </div>

        <button className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add New Medicine
        </button>
      </div>

      {/* Catalogue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">
            Active Product Master ({products.length} medicines)
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>GST & HSN compliant</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Medicine & Salt</th>
                <th className="p-3">Manufacturer</th>
                <th className="p-3">Dosage & Strength</th>
                <th className="p-3">Schedule</th>
                <th className="p-3">HSN & GST</th>
                <th className="p-3 text-right">MRP</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-right">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const totalStock = p.batches.reduce(
                  (acc, b) => acc + b.locationStock.reduce((sAcc, ls) => sAcc + ls.quantity, 0),
                  0
                );

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.genericName}</div>
                    </td>
                    <td className="p-3 text-slate-700">{p.manufacturer}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{p.dosageForm}</div>
                      <div className="text-[10px] text-slate-500">{p.strength} • {p.packSize}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          p.schedule === "OTC"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : p.schedule === "SCHEDULE_H1"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {p.schedule}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      <div>HSN: {p.hsnCode}</div>
                      <div className="text-[10px] font-semibold text-emerald-700">{p.gstRate}% GST</div>
                    </td>
                    <td className="p-3 text-right font-medium text-slate-600">
                      {formatINR(p.mrp)}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {formatINR(p.sellingPrice)}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {totalStock} <span className="text-[10px] font-normal text-slate-500">units</span>
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
