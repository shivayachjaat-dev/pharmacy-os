import Link from "next/link";
import {
  ShoppingCart,
  LayoutDashboard,
  Globe,
  FileCheck,
  Search,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles,
  Store,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const portals = [
    {
      title: "Store Operations & POS",
      subtitle: "High-speed billing counter, FEFO batch allocation, barcode scanner, thermal receipt print",
      href: "/pos",
      icon: ShoppingCart,
      color: "bg-emerald-600 text-white",
      badge: "Counter Staff & Pharmacist",
      features: ["Instant Shelf Bin Display", "Schedule H Doctor Verification", "Split UPI/Cash/Card"],
    },
    {
      title: "Owner Command Center",
      subtitle: "Multi-store consolidated KPIs, estimated gross profit margins, inventory valuation & cash",
      href: "/dashboard",
      icon: LayoutDashboard,
      color: "bg-indigo-600 text-white",
      badge: "Pharmacy Chain Owner",
      features: ["Multi-Store Performance", "Expiry Loss Liabilities", "Cash Drawer Float Audit"],
    },
    {
      title: "Shelf Intelligence Engine",
      subtitle: "5-Tier physical topology (Store ➔ Zone ➔ Rack ➔ Shelf ➔ Bin) with walk-sequence routing",
      href: "/inventory/stock-lookup",
      icon: Layers,
      color: "bg-amber-600 text-white",
      badge: "Core Differentiator",
      features: ["Sub-second Medicine Locator", "Shelf Transfer Workflow", "Barcode/Bin Label Printing"],
    },
    {
      title: "Customer Web Storefront",
      subtitle: "Branded mobile-first online pharmacy portal for local customers with live branch stock",
      href: "/store/apollo-health",
      icon: Globe,
      color: "bg-blue-600 text-white",
      badge: "End Consumer Experience",
      features: ["Search by Salt or Brand", "Prescription PDF/Image Upload", "Click & Collect / Local Delivery"],
    },
    {
      title: "Pharmacist Rx Queue",
      subtitle: "Statutory prescription review gate enforcing Drugs & Cosmetics Act and Pharmacy Council rules",
      href: "/prescriptions",
      icon: FileCheck,
      color: "bg-rose-600 text-white",
      badge: "Statutory Regulatory Core",
      features: ["Digital Rx Inspection", "Approve/Reject Sign-Off", "Council Reg # Audit Trail"],
    },
    {
      title: "SaaS Super Admin",
      subtitle: "Multi-tenant platform control plane managing subscriptions (Solo, Growth, Chain) and health",
      href: "/admin",
      icon: ShieldAlert,
      color: "bg-slate-800 text-white",
      badge: "Platform Provider",
      features: ["Tenant Isolation Health", "Subscription Limits", "System Diagnostics"],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-8 py-4 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-900/50">
            Rx
          </div>
          <div>
            <div className="font-bold text-white text-lg tracking-tight flex items-center gap-2">
              PharmacyOS
              <span className="text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                India Market Edition
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Autonomous Commercial Grade Pharmacy ERP & Consumer Commerce Platform
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950 border border-emerald-800 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Seed Data Ready
          </span>
          <Link
            href="/pos"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-sm"
          >
            Launch POS Counter <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Hero & Portal Grid */}
      <main className="max-w-7xl mx-auto px-8 py-12 flex-1">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Connected Omnichannel Architecture
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
            The Complete Operating System for Indian Pharmacies
          </h1>
          <p className="mt-4 text-slate-400 text-base">
            From physical shelf bin picking and Schedule H prescription verification to split-second billing and white-label consumer ordering, PharmacyOS delivers complete operational autonomy.
          </p>
        </div>

        {/* Experience Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portals.map((portal, idx) => {
            const Icon = portal.icon;
            return (
              <Link
                key={idx}
                href={portal.href}
                className="group relative rounded-2xl bg-slate-800/50 border border-slate-700/60 p-6 hover:bg-slate-800 hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-emerald-950/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${portal.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded-full">
                      {portal.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                    {portal.title}
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {portal.subtitle}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/60 space-y-1.5">
                  {portal.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 px-8 py-5 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          PharmacyOS v1.0 • Built with Next.js 15, TypeScript, Tailwind CSS & Prisma ORM
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Command Center</Link>
          <Link href="/pos" className="hover:text-slate-300 transition-colors">POS</Link>
          <Link href="/inventory/stock-lookup" className="hover:text-slate-300 transition-colors">Shelf Lookup</Link>
          <Link href="/store/apollo-health" className="hover:text-slate-300 transition-colors">Customer Store</Link>
          <Link href="/admin" className="hover:text-slate-300 transition-colors">Admin</Link>
        </div>
      </footer>
    </div>
  );
}
