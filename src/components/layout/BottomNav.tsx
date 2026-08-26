"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PieChart, Plus, Wallet, Settings } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function BottomNav() {
  const pathname = usePathname();
  const { openQuickAdd } = useApp();

  const navItems = [
    { label: "Beranda", href: "/", icon: Home },
    { label: "Laporan", href: "/reports", icon: PieChart },
    { label: "Quick Add", isAction: true },
    { label: "Dompet", href: "/wallets", icon: Wallet },
    { label: "Pengaturan", href: "/settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe glass-nav">
      <div className="max-w-xl mx-auto flex items-center justify-around px-2 py-1.5 relative">
        {navItems.map((item, idx) => {
          if (item.isAction) {
            return (
              <div key={idx} className="relative -top-4 flex flex-col items-center">
                <button
                  onClick={() => openQuickAdd("EXPENSE")}
                  aria-label="Catat Transaksi Cepat"
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 ring-4 ring-slate-900 tap-effect transition-all transform active:scale-90 hover:scale-105 cursor-pointer"
                >
                  <Plus className="w-7 h-7 stroke-[2.5]" />
                </button>
                <span className="text-[10px] font-semibold text-blue-400 mt-1">
                  Catat
                </span>
              </div>
            );
          }

          const Icon = item.icon!;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href || "");

          return (
            <Link
              key={idx}
              href={item.href || "/"}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl tap-effect transition-colors ${
                isActive
                  ? "text-blue-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? "scale-110 stroke-[2.3]" : "stroke-[1.8]"
                }`}
              />
              <span className="text-[11px] mt-1 tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
