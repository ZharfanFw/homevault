"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils/format";
import { CategoryIcon } from "@/lib/utils/icons";
import { ChevronDown, Calendar } from "lucide-react";

export interface TodayCategoryItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number;
  percentage: number;
  transactionCount: number;
}

export interface TodayExpenseData {
  date: string;
  totalExpense: number;
  transactionCount: number;
  categoryBreakdown: TodayCategoryItem[];
}

interface TodayExpenseCardProps {
  todayData: TodayExpenseData | null;
  isLoading?: boolean;
}

export function TodayExpenseCard({
  todayData,
  isLoading = false,
}: TodayExpenseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format date readable (e.g. "Jumat, 2 Oktober 2026")
  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return "Hari Ini";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Hari Ini";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-[#2E3440] border border-[#434C5E] animate-pulse">
        <div className="h-5 w-36 bg-[#3B4252] rounded-lg mb-2" />
        <div className="h-8 w-48 bg-[#3B4252] rounded-lg" />
      </div>
    );
  }

  const totalExpense = todayData?.totalExpense ?? 0;
  const categories = todayData?.categoryBreakdown ?? [];
  const transactionCount = todayData?.transactionCount ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl bg-[#2E3440] border border-[#434C5E] hover:border-[#88C0D0]/50 transition-all shadow-md">
      {/* Clickable Header Card */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition-colors hover:bg-[#353C4A]/50 tap-effect"
        aria-expanded={isExpanded}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#88C0D0]/15 text-[#88C0D0] border border-[#88C0D0]/30 uppercase tracking-wider">
              <Calendar className="w-3 h-3" /> Hari Ini
            </span>
            <span className="text-[11px] text-[#81A1C1] truncate">
              {formatDateLabel(todayData?.date)}
            </span>
          </div>

          <h3 className="text-xs sm:text-sm font-semibold text-[#D8DEE9]">
            Total Pengeluaran Hari Ini
          </h3>
          <p className="text-xl sm:text-2xl font-black font-mono text-[#ECEFF4] mt-0.5 tracking-tight">
            {formatCurrency(totalExpense)}
          </p>

          <p className="text-[11px] text-[#81A1C1] mt-1 flex items-center gap-1">
            {totalExpense > 0 ? (
              <span>
                {transactionCount} transaksi di {categories.length} kategori •{" "}
                <span className="text-[#88C0D0] font-semibold underline underline-offset-2">
                  {isExpanded ? "Tutup rincian" : "Lihat rincian kategori"}
                </span>
              </span>
            ) : (
              <span className="text-[#A3BE8C] font-semibold">
                Belum ada pengeluaran hari ini
              </span>
            )}
          </p>
        </div>

        {/* Chevron Indicator */}
        <div className="flex flex-col items-center justify-center pl-2 shrink-0">
          <div
            className={`w-8 h-8 rounded-xl bg-[#242933] border border-[#434C5E] flex items-center justify-center text-[#88C0D0] transition-transform duration-200 ${
              isExpanded ? "rotate-180 bg-[#3B4252]" : ""
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Expanded Breakdown Section */}
      {isExpanded && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-[#434C5E]/70 animate-fade-in space-y-3.5">
          {categories.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#242933]/70 border border-[#434C5E]/50 text-center text-xs text-[#81A1C1] space-y-1">
              <p className="font-semibold text-[#A3BE8C]">
                Belum ada transaksi pengeluaran hari ini.
              </p>
              <p className="text-[11px] text-[#D8DEE9]/70">
                Semua pengeluaran yang dicatat pada hari ini akan otomatis dirinci di sini.
              </p>
            </div>
          ) : (
            <>
              {/* Multi-Segment Proportional Visual Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-[#81A1C1]">
                  <span>Proporsi Pengeluaran Hari Ini</span>
                  <span>100%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#242933] flex overflow-hidden p-0.5 border border-[#434C5E]">
                  {categories.map((cat, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${Math.max(cat.percentage, 2)}%`,
                        backgroundColor: cat.categoryColor || "#4C566A",
                      }}
                      className="h-full rounded-full first:rounded-l-full last:rounded-r-full transition-all"
                      title={`${cat.categoryName}: ${cat.percentage}% (${formatCurrency(cat.totalAmount)})`}
                    />
                  ))}
                </div>
              </div>

              {/* Sorted Category Breakdown List */}
              <div className="space-y-2 pt-1">
                {categories.map((cat) => (
                  <div
                    key={cat.categoryId || cat.categoryName}
                    className="p-3 rounded-xl bg-[#242933]/90 border border-[#434C5E]/60 space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2E3440] shrink-0 font-bold"
                          style={{
                            backgroundColor: cat.categoryColor || "#81A1C1",
                          }}
                        >
                          <CategoryIcon
                            name={cat.categoryIcon}
                            className="w-4 h-4"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-[#ECEFF4] block truncate">
                            {cat.categoryName}
                          </span>
                          <span className="text-[10px] text-[#81A1C1] font-mono">
                            {cat.transactionCount} transaksi
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold font-mono text-[#ECEFF4]">
                          {formatCurrency(cat.totalAmount)}
                        </span>
                        <span className="text-[11px] font-bold text-[#88C0D0] ml-1.5 font-mono">
                          ({cat.percentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar for Category */}
                    <div className="w-full bg-[#2E3440] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.categoryColor || "#88C0D0",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
