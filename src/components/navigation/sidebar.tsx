"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Search,
  Layers,
  Pill,
  Clock,
  ArrowLeftRight,
  Truck,
  FileCheck,
  CircleDollarSign,
  Globe,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  highlight?: boolean;
  external?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Operations",
    items: [
      { name: "POS Counter", href: "/pos", icon: ShoppingCart, badge: "Alt+P" },
      { name: "Stock & Shelf Lookup", href: "/inventory/stock-lookup", icon: Search, badge: "F2" },
      { name: "Customer Orders", href: "/orders", icon: Truck },
      { name: "Pharmacist Rx Queue", href: "/prescriptions", icon: FileCheck, highlight: true },
    ],
  },
  {
    title: "Shelf & Inventory",
    items: [
      { name: "Shelf Intelligence", href: "/inventory/shelves", icon: Layers },
      { name: "Medicine Master", href: "/inventory/products", icon: Pill },
      { name: "Batch & Expiry Center", href: "/inventory/expiry", icon: Clock },
      { name: "Inter-Store Transfers", href: "/inventory/transfers", icon: ArrowLeftRight },
      { name: "Procurement & POs", href: "/purchases", icon: Sliders },
    ],
  },
  {
    title: "Executive & Finance",
    items: [
      { name: "Owner Command Center", href: "/dashboard", icon: LayoutDashboard },
      { name: "Cash Session & Float", href: "/finance/cash-session", icon: CircleDollarSign },
    ],
  },
  {
    title: "Channels & Platform",
    items: [
      { name: "Customer Web Store", href: "/store/apollo-health", icon: Globe, external: true },
      { name: "SaaS Super Admin", href: "/admin", icon: ShieldAlert },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-900/50">
            Rx
          </div>
          <div>
            <div className="font-bold text-white tracking-tight flex items-center gap-1.5 text-base">
              PharmacyOS
              <span className="text-[10px] uppercase font-semibold bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
              Apollo Health Medicos
            </div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {sec.title}
            </div>
            {sec.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && !item.external);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group",
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-400")} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-mono px-1.5 py-0.2 rounded",
                        isActive
                          ? "bg-emerald-700 text-emerald-100"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-800/80 text-emerald-200 font-semibold text-xs flex items-center justify-center border border-emerald-600/50">
              PN
            </div>
            <div>
              <div className="text-xs font-medium text-white truncate max-w-[110px]">
                Priya Nair
              </div>
              <div className="text-[10px] text-emerald-400 truncate">
                Reg: DL-PH-48291
              </div>
            </div>
          </div>
          <div className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded">
            Pharmacist
          </div>
        </div>
      </div>
    </aside>
  );
}
