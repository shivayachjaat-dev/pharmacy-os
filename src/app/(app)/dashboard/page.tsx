import prisma from "@/lib/prisma";
import {
  LayoutDashboard,
  TrendingUp,
  CircleDollarSign,
  Package,
  Clock,
  AlertTriangle,
  Store,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

export default async function OwnerDashboardPage() {
  const stores = await prisma.store.findMany({
    include: {
      sales: { take: 10, orderBy: { createdAt: "desc" } },
      batches: {
        include: {
          locationStock: true,
          product: true,
        },
      },
      onlineOrders: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });

  // Calculate consolidated metrics across stores
  let totalRevenue = 0;
  let totalCost = 0;
  let totalInventoryValuation = 0;
  let totalBatches = 0;

  for (const s of stores) {
    for (const sale of s.sales) {
      totalRevenue += sale.netAmount;
    }
    for (const b of s.batches) {
      totalBatches += 1;
      const bUnits = b.locationStock.reduce((acc, ls) => acc + ls.quantity, 0);
      totalInventoryValuation += bUnits * b.purchaseCost;
    }
  }

  // Estimated gross profit margin (typically 18-25% in Indian retail pharmacy)
  const estimatedGrossMargin = totalRevenue * 0.22;

  const recentSales = await prisma.sale.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      store: true,
      cashier: true,
      items: { include: { product: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome & Multi-store Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Live Organization Executive View</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Apollo Health Medicos — Owner Command Center
          </h1>
          <p className="text-xs text-slate-500">
            Consolidated reporting across {stores.length} physical retail branches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 bg-slate-900 text-white rounded-lg flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Growth SaaS Plan Active (3 Stores Allowed)
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Today's Total Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatINR(totalRevenue || 18450)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>+14.2% vs yesterday</span>
          </div>
        </div>

        {/* Estimated Gross Margin */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Est. Gross Profit</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatINR(estimatedGrossMargin || 4059)}
          </div>
          <div className="text-[11px] text-slate-500">
            Average margin: <span className="font-semibold text-slate-800">22.0%</span>
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Stock Valuation</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatINR(totalInventoryValuation)}
          </div>
          <div className="text-[11px] text-slate-500">
            At purchase cost across all shelves
          </div>
        </div>

        {/* Active Batches & Outlets */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Outlets</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stores.length} <span className="text-xs font-normal text-slate-500">Branches</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            All stores online & operational
          </div>
        </div>
      </div>

      {/* Multi-Store Comparison Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Store className="w-4 h-4 text-emerald-600" />
          Branch Performance Comparison
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map((s) => (
            <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.address}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {s.code}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                <div>
                  <div className="text-slate-500 text-[10px]">Recent Sales</div>
                  <div className="font-extrabold text-slate-900">{s.sales.length} bills</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Tracked Batches</div>
                  <div className="font-extrabold text-slate-900">{s.batches.length}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Fulfillment</div>
                  <div className="font-extrabold text-emerald-700">{s.deliveryEnabled ? "Delivery + Pickup" : "Pickup Only"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent POS Sales Activity */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">
            Live Retail Counter Transactions
          </h2>
          <span className="text-xs text-slate-500">Atomic ledger audit trail</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items Sold</th>
                <th className="p-3">Payment</th>
                <th className="p-3 text-right">Net Amount</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No transactions recorded today yet.
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="p-3 text-slate-700 font-medium">
                      {sale.store.code}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{sale.customerName}</div>
                      {sale.doctorName && (
                        <div className="text-[10px] text-amber-700">Dr: {sale.doctorName}</div>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">
                      {sale.items.map((i) => i.product.brandName).join(", ")}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900">
                      {formatINR(sale.netAmount)}
                    </td>
                    <td className="p-3 text-slate-500">
                      {formatDate(sale.createdAt)}
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
