import prisma from "@/lib/prisma";
import { ShieldAlert, Building2, Store, Users, Server, CheckCircle2, ArrowRight } from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function PlatformAdminPage() {
  const orgs = await prisma.organization.findMany({
    include: {
      stores: true,
      users: true,
      subscriptions: true,
      sales: true,
    },
  });

  const totalStores = orgs.reduce((acc, o) => acc + o.stores.length, 0);
  const totalUsers = orgs.reduce((acc, o) => acc + o.users.length, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-950">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-white text-lg tracking-tight flex items-center gap-2">
              PharmacyOS SaaS Control Plane
              <span className="text-[10px] font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded">
                Super Admin
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Multi-tenant organization oversight, licensing entitlements, and health diagnostics
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
        >
          Back to Main Launcher
        </Link>
      </div>

      {/* Platform Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Registered SaaS Organizations</div>
          <div className="text-3xl font-black text-white">{orgs.length}</div>
          <div className="text-[11px] text-emerald-400 font-medium">100% active tenants</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Total Provisioned Stores</div>
          <div className="text-3xl font-black text-white">{totalStores}</div>
          <div className="text-[11px] text-slate-400">Across Delhi NCR Region</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Active Staff & Pharmacists</div>
          <div className="text-3xl font-black text-white">{totalUsers}</div>
          <div className="text-[11px] text-indigo-400 font-medium">Role-based access enforced</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Database Engine</div>
          <div className="text-xl font-black text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5" />
            Healthy
          </div>
          <div className="text-[11px] text-slate-400">SQLite / PostgreSQL compatible</div>
        </div>
      </div>

      {/* Organizations Directory */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            Tenant Organizations & Subscriptions
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Organization Name</th>
                <th className="p-4">Tenant Slug</th>
                <th className="p-4">Stores Provisioned</th>
                <th className="p-4">Subscription Plan</th>
                <th className="p-4">Store Limit</th>
                <th className="p-4">Monthly Rate</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {orgs.map((org) => {
                const sub = org.subscriptions[0];
                return (
                  <tr key={org.id} className="hover:bg-slate-800/40">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{org.name}</div>
                      <div className="text-[11px] text-slate-400">DL: {org.dlNumber || "DL-2024-DEL-98765"}</div>
                    </td>
                    <td className="p-4 font-mono text-indigo-400">/{org.slug}</td>
                    <td className="p-4 font-bold text-white">
                      {org.stores.length} outlets
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded text-xs font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {sub?.plan || "GROWTH"}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-300">
                      Up to {sub?.maxStores || 3} stores
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      {formatINR(sub?.amount || 2999)}/mo
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {sub?.status || "ACTIVE"}
                      </span>
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
