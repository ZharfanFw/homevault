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
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe glass-nav border-t border-[#434C5E]/60">
      <div className="max-w-xl mx-auto flex items-center justify-around px-2 py-1.5 relative">
        {navItems.map((item, idx) => {
          if (item.isAction) {
            return (
              <div key={idx} className="relative -top-4 flex flex-col items-center">
                <button
                  onClick={() => openQuickAdd("EXPENSE")}
                  aria-label="Catat Transaksi Cepat"
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#5E81AC] via-[#81A1C1] to-[#88C0D0] text-[#2E3440] flex items-center justify-center shadow-lg shadow-[#88C0D0]/30 ring-4 ring-[#242933] tap-effect transition-all transform active:scale-90 hover:scale-105 cursor-pointer"
                >
                  <Plus className="w-7 h-7 stroke-[2.8]" />
                </button>
                <span className="text-[10px] font-bold text-[#88C0D0] mt-1 tracking-tight">
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
                  ? "text-[#88C0D0] font-bold"
                  : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? "scale-110 stroke-[2.4]" : "stroke-[1.8]"
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
