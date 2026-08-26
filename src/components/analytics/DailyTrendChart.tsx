"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils/format";

interface DailyTrendItem {
  day: number;
  expense: number;
  income: number;
}

interface DailyTrendChartProps {
  dailyTrends: DailyTrendItem[];
  month: number;
  year: number;
}

export function DailyTrendChart({
  dailyTrends,
  month,
  year,
}: DailyTrendChartProps) {
  const [hoveredDay, setHoveredDay] = useState<DailyTrendItem | null>(null);

  const maxExpense = Math.max(...dailyTrends.map((d) => d.expense), 1000);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Tren Pengeluaran Harian
        </h4>
        {hoveredDay && (
          <span className="text-[11px] font-mono text-red-400 font-semibold">
            Tgl {hoveredDay.day}: {formatCurrency(hoveredDay.expense)}
          </span>
        )}
      </div>

      <div className="flex items-end gap-1 h-32 pt-6 pb-2 overflow-x-auto no-scrollbar">
        {dailyTrends.map((item) => {
          const heightPct = Math.min(
            100,
            Math.max(4, Math.round((item.expense / maxExpense) * 100))
          );
          const hasExpense = item.expense > 0;

          return (
            <div
              key={item.day}
              onMouseEnter={() => setHoveredDay(item)}
              onTouchStart={() => setHoveredDay(item)}
              onMouseLeave={() => setHoveredDay(null)}
              className="flex-1 min-w-[10px] sm:min-w-[12px] h-full flex flex-col justify-end items-center group cursor-pointer tap-effect"
            >
              <div
                style={{ height: `${hasExpense ? heightPct : 4}%` }}
                className={`w-full rounded-t-md transition-all ${
                  hasExpense
                    ? "bg-gradient-to-t from-red-600/80 to-rose-400 group-hover:from-red-500 group-hover:to-rose-300 shadow-sm"
                    : "bg-slate-800/40"
                }`}
              />
              <span className="text-[9px] font-mono text-slate-500 mt-1">
                {item.day % 5 === 0 || item.day === 1 ? item.day : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
