"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils/format";
import { MonthlyAnnualData } from "@/app/api/analytics/annual/route";

interface AnnualTrendChartProps {
  monthlyData: MonthlyAnnualData[];
  year: number;
}

export function AnnualTrendChart({ monthlyData, year }: AnnualTrendChartProps) {
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyAnnualData | null>(null);

  const maxAmount = Math.max(
    ...monthlyData.map((d) => Math.max(d.income, d.expense)),
    1000000
  );

  const hasAnyData = monthlyData.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[#2E3440] border border-[#434C5E] shadow-md">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#81A1C1]">
            Tren Pemasukan vs Pengeluaran 12 Bulan ({year})
          </h4>
          <p className="text-[11px] text-[#D8DEE9]/60 mt-0.5">
            Ketuk atau sorot bulan untuk melihat rincian
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A3BE8C]" />
            <span className="text-[#D8DEE9]/80 font-medium text-[11px]">Pemasukan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BF616A]" />
            <span className="text-[#D8DEE9]/80 font-medium text-[11px]">Pengeluaran</span>
          </div>
        </div>
      </div>

      {/* Interactive Tooltip Card */}
      <div className="min-h-[46px] mb-2 p-2.5 rounded-xl bg-[#242933] border border-[#434C5E]/50 flex items-center justify-between text-xs transition-all">
        {hoveredMonth ? (
          <>
            <div>
              <span className="font-bold text-[#ECEFF4] block">
                {hoveredMonth.monthName} {year}
              </span>
              <span className="text-[10px] text-[#81A1C1]">
                Rasio Simpanan: {hoveredMonth.savingsRate}%
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <div>
                <span className="text-[#81A1C1] text-[10px] block">Masuk</span>
                <span className="text-[#A3BE8C] font-bold">
                  {formatCurrency(hoveredMonth.income)}
                </span>
              </div>
              <div>
                <span className="text-[#81A1C1] text-[10px] block">Keluar</span>
                <span className="text-[#BF616A] font-bold">
                  {formatCurrency(hoveredMonth.expense)}
                </span>
              </div>
              <div>
                <span className="text-[#81A1C1] text-[10px] block">Selisih</span>
                <span
                  className={`font-bold ${
                    hoveredMonth.net >= 0 ? "text-[#A3BE8C]" : "text-[#BF616A]"
                  }`}
                >
                  {hoveredMonth.net >= 0 ? "+" : ""}
                  {formatCurrency(hoveredMonth.net)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <span className="text-xs text-[#81A1C1] italic">
            Sorot salah satu batang bulan untuk melihat rincian arus kas...
          </span>
        )}
      </div>

      {/* Chart Bars */}
      {!hasAnyData ? (
        <div className="text-center py-10 text-xs text-[#81A1C1]">
          Belum ada data transaksi di tahun {year}
        </div>
      ) : (
        <div className="flex items-end gap-1.5 sm:gap-2 h-44 pt-4 pb-2 overflow-x-auto no-scrollbar">
          {monthlyData.map((item) => {
            const incomeHeight =
              item.income > 0 ? Math.max(4, Math.round((item.income / maxAmount) * 100)) : 2;
            const expenseHeight =
              item.expense > 0 ? Math.max(4, Math.round((item.expense / maxAmount) * 100)) : 2;

            const isHovered = hoveredMonth?.month === item.month;

            return (
              <div
                key={item.month}
                onMouseEnter={() => setHoveredMonth(item)}
                onTouchStart={() => setHoveredMonth(item)}
                className={`flex-1 min-w-[20px] sm:min-w-[26px] h-full flex flex-col justify-end items-center group cursor-pointer tap-effect transition-all ${
                  isHovered ? "opacity-100" : hoveredMonth ? "opacity-60" : "opacity-95"
                }`}
              >
                {/* Grouped Dual Bars */}
                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                  {/* Income bar */}
                  <div
                    style={{ height: `${incomeHeight}%` }}
                    className={`w-1/2 rounded-t-sm transition-all ${
                      item.income > 0
                        ? "bg-gradient-to-t from-[#8FBCBB] to-[#A3BE8C] group-hover:brightness-110 shadow-sm"
                        : "bg-[#3B4252]/40"
                    }`}
                  />
                  {/* Expense bar */}
                  <div
                    style={{ height: `${expenseHeight}%` }}
                    className={`w-1/2 rounded-t-sm transition-all ${
                      item.expense > 0
                        ? "bg-gradient-to-t from-[#D08770] to-[#BF616A] group-hover:brightness-110 shadow-sm"
                        : "bg-[#3B4252]/40"
                    }`}
                  />
                </div>

                {/* Month label */}
                <span
                  className={`text-[9px] sm:text-[10px] font-mono mt-1.5 transition-colors ${
                    isHovered
                      ? "text-[#88C0D0] font-bold"
                      : "text-[#D8DEE9]/70 group-hover:text-[#ECEFF4]"
                  }`}
                >
                  {item.shortMonthName}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
