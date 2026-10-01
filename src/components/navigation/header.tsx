"use client";

import { useState } from "react";
import { Store, Wifi, Bell, ShieldCheck, ChevronDown, Check } from "lucide-react";

export function Header({ currentStoreName = "Apollo Medicos — Connaught Place (CP-01)" }: { currentStoreName?: string }) {
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(currentStoreName);

  const stores = [
    { id: "store-cp-main", name: "Apollo Medicos — Connaught Place (CP-01)", tag: "Flagship / 24x7" },
    { id: "store-gp-branch", name: "Apollo Medicos — Green Park Branch (GP-02)", tag: "Sub-branch" },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: Store Selector */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-800"
          >
            <Store className="w-4 h-4 text-emerald-600" />
            <span className="max-w-[280px] truncate">{selectedStore}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {storeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-80 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Active Branch
              </div>
              {stores.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStore(s.name);
                    setStoreDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-slate-900">{s.name}</div>
                    <div className="text-[10px] text-slate-500">{s.tag}</div>
                  </div>
                  {selectedStore.includes(s.id === "store-cp-main" ? "Connaught" : "Green") && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Shift Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Day Shift Active
        </div>
      </div>

      {/* Right: Operational Badges & User Status */}
      <div className="flex items-center gap-4">
        {/* Network & Local Sync Status */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">POS Cloud Sync:</span>
          <span className="text-emerald-700 font-semibold">Online</span>
        </div>

        {/* Regulatory Protection Indicator */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          Schedule H/H1 Safeguard: <span className="font-semibold text-blue-700">Enforced</span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
