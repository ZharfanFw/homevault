"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils/format";
import { Eye, EyeOff, TrendingUp, TrendingDown, ArrowLeftRight, Plus, Minus } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface NetWorthCardProps {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netCashflow: number;
}

export function NetWorthCard({
  netWorth,
  monthlyIncome,
  monthlyExpense,
  netCashflow,
}: NetWorthCardProps) {
  const [hideBalance, setHideBalance] = useState(false);
  const { openQuickAdd } = useApp();

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#2E3440] via-[#3B4252] to-[#2E3440] border border-[#434C5E] shadow-2xl">
      {/* Background glow circles */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#88C0D0]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#5E81AC]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Net Worth */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#81A1C1]">
            Total Kekayaan Bersih
          </span>
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="p-1.5 text-[#D8DEE9] hover:text-[#ECEFF4] rounded-lg hover:bg-[#434C5E]/50 tap-effect"
            aria-label={hideBalance ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
          >
            {hideBalance ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#ECEFF4] tracking-tight font-mono">
            {hideBalance ? "••••••••••" : formatCurrency(netWorth)}
          </h2>
        </div>

        {/* Monthly Cashflow Row */}
        <div className="grid grid-cols-3 gap-2 mt-5 p-3.5 rounded-2xl bg-[#242933]/80 border border-[#434C5E]/80 backdrop-blur-md">
          {/* Income */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#A3BE8C] mb-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Pemasukan
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-[#ECEFF4] font-mono truncate">
              {hideBalance ? "•••••" : formatCurrency(monthlyIncome)}
            </p>
          </div>

          {/* Expense */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#BF616A] mb-0.5">
              <TrendingDown className="w-3.5 h-3.5" /> Pengeluaran
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-[#ECEFF4] font-mono truncate">
              {hideBalance ? "•••••" : formatCurrency(monthlyExpense)}
            </p>
          </div>

          {/* Net Cashflow */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#88C0D0] mb-0.5">
              <ArrowLeftRight className="w-3.5 h-3.5" /> Arus Kas
            </div>
            <p
              className={`text-xs sm:text-sm font-extrabold font-mono truncate ${
                netCashflow >= 0 ? "text-[#A3BE8C]" : "text-[#BF616A]"
              }`}
            >
              {hideBalance
                ? "•••••"
                : `${netCashflow >= 0 ? "+" : ""}${formatCurrency(netCashflow)}`}
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <button
            onClick={() => openQuickAdd("EXPENSE")}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-[#BF616A]/15 hover:bg-[#BF616A]/25 text-[#BF616A] border border-[#BF616A]/30 text-xs font-bold tap-effect cursor-pointer shadow-sm transition-all"
          >
            <Minus className="w-3.5 h-3.5 stroke-[2.5]" /> Keluar
          </button>
          <button
            onClick={() => openQuickAdd("INCOME")}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-[#A3BE8C]/15 hover:bg-[#A3BE8C]/25 text-[#A3BE8C] border border-[#A3BE8C]/30 text-xs font-bold tap-effect cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Masuk
          </button>
          <button
            onClick={() => openQuickAdd("TRANSFER")}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-[#88C0D0]/15 hover:bg-[#88C0D0]/25 text-[#88C0D0] border border-[#88C0D0]/30 text-xs font-bold tap-effect cursor-pointer shadow-sm transition-all"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" /> Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
