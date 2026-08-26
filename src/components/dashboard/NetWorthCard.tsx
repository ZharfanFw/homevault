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
    <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 shadow-2xl">
      {/* Background glow circles */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Net Worth */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Kekayaan Bersih
          </span>
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="p-1 text-slate-400 hover:text-white rounded-lg tap-effect"
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
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            {hideBalance ? "••••••••••" : formatCurrency(netWorth)}
          </h2>
        </div>

        {/* Monthly Cashflow Row */}
        <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md">
          {/* Income */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 mb-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Pemasukan
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-200 font-mono truncate">
              {hideBalance ? "•••••" : formatCurrency(monthlyIncome)}
            </p>
          </div>

          {/* Expense */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-red-400 mb-0.5">
              <TrendingDown className="w-3.5 h-3.5" /> Pengeluaran
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-200 font-mono truncate">
              {hideBalance ? "•••••" : formatCurrency(monthlyExpense)}
            </p>
          </div>

          {/* Net Cashflow */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-blue-400 mb-0.5">
              <ArrowLeftRight className="w-3.5 h-3.5" /> Arus Kas
            </div>
            <p
              className={`text-xs sm:text-sm font-bold font-mono truncate ${
                netCashflow >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {hideBalance
                ? "•••••"
                : `${netCashflow >= 0 ? "+" : ""}${formatCurrency(netCashflow)}`}
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={() => openQuickAdd("EXPENSE")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold tap-effect cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" /> Keluar
          </button>
          <button
            onClick={() => openQuickAdd("INCOME")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold tap-effect cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Masuk
          </button>
          <button
            onClick={() => openQuickAdd("TRANSFER")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold tap-effect cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
