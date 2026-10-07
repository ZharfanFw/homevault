"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils/format";
import { CategoryIcon } from "@/lib/utils/icons";
import { ChevronDown, Calendar } from "lucide-react";

export interface TodayTransactionDetail {
  id: string;
  amount: number;
  notes?: string | null;
  walletName?: string | null;
  walletColor?: string | null;
  createdAt?: string | number | Date;
}

export interface TodayCategoryItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number;
  percentage: number;
  transactionCount: number;
  transactions?: TodayTransactionDetail[];
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
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});

  // Format date readable (e.g. "Sabtu, 3 Oktober 2026")
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

  const formatTime = (createdAt?: string | number | Date) => {
    if (!createdAt) return "";
    try {
      const d = new Date(createdAt);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const toggleCategory = (catKey: string) => {
    setExpandedCategoryIds((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-5 rounded-3xl bg-[#2E3440] border border-[#434C5E] animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-[#3B4252] rounded-lg" />
          <div className="h-6 w-24 bg-[#3B4252] rounded-lg" />
        </div>
        <div className="h-3 w-40 bg-[#3B4252] rounded-lg mt-3" />
      </div>
    );
  }

  const totalExpense = todayData?.totalExpense ?? 0;
  const categories = todayData?.categoryBreakdown ?? [];
  const transactionCount = todayData?.transactionCount ?? 0;

  return (
    <div className="overflow-hidden rounded-3xl bg-[#2E3440] border border-[#434C5E] hover:border-[#88C0D0]/50 transition-all shadow-md group">
      {/* Clickable Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full p-4 sm:p-5 text-left transition-colors hover:bg-[#353C4A]/40 tap-effect"
        aria-expanded={isExpanded}
      >
        {/* Top Row: Title + Date vs Amount */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#88C0D0]/15 border border-[#88C0D0]/30 text-[#88C0D0] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#81A1C1] block leading-none">
                Pengeluaran Hari Ini
              </span>
              <span className="text-xs font-semibold text-[#ECEFF4] mt-1 block truncate">
                {formatDateLabel(todayData?.date)}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-lg sm:text-xl font-black font-mono text-[#ECEFF4] tracking-tight">
              {formatCurrency(totalExpense)}
            </div>
            <span className="text-[10px] font-mono text-[#81A1C1]">
              {totalExpense > 0 ? `${transactionCount} transaksi` : "Nihil"}
            </span>
          </div>
        </div>

        {/* Bottom Helper Bar & Action Toggle */}
        <div className="mt-3 pt-2.5 border-t border-[#434C5E]/50 flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#81A1C1] truncate">
            {totalExpense > 0
              ? `${categories.length} kategori pengeluaran`
              : "Belum ada transaksi pengeluaran"}
          </span>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#88C0D0] group-hover:text-[#8FBCBB] shrink-0">
            <span>{isExpanded ? "Tutup Rincian" : "Lihat Rincian"}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </span>
        </div>
      </button>

      {/* Expanded Breakdown Section */}
      {isExpanded && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 border-t border-[#434C5E]/70 animate-fade-in space-y-3 bg-[#242933]/30">
          {categories.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-[#242933]/70 border border-[#434C5E]/50 text-center text-xs text-[#81A1C1] space-y-1">
              <p className="font-semibold text-[#A3BE8C]">
                Belum ada transaksi pengeluaran hari ini.
              </p>
              <p className="text-[11px] text-[#D8DEE9]/70">
                Pengeluaran yang dicatat pada hari ini akan otomatis dirinci di sini.
              </p>
            </div>
          ) : (
            <>
              {/* Multi-Segment Proportional Visual Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-[#81A1C1]">
                  <span>Proporsi Kategori Hari Ini</span>
                  <span>100%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#242933] flex overflow-hidden p-0.5 border border-[#434C5E]">
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
                {categories.map((cat) => {
                  const catKey = cat.categoryId || cat.categoryName;
                  const isCatExpanded = !!expandedCategoryIds[catKey];
                  const txList = cat.transactions || [];

                  return (
                    <div
                      key={catKey}
                      className="p-3 rounded-2xl bg-[#242933]/90 border border-[#434C5E]/60 hover:border-[#88C0D0]/50 space-y-2 shadow-sm transition-all"
                    >
                      {/* Clickable Category Header */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(catKey)}
                        className="w-full flex items-center justify-between text-left tap-effect focus:outline-none group/cat"
                        aria-expanded={isCatExpanded}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2E3440] shrink-0 font-bold shadow-sm"
                            style={{
                              backgroundColor: cat.categoryColor || "#81A1C1",
                            }}
                          >
                            <CategoryIcon
                              name={cat.categoryIcon}
                              className="w-3.5 h-3.5"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#ECEFF4] block truncate group-hover/cat:text-[#88C0D0] transition-colors">
                              {cat.categoryName}
                            </span>
                            <span className="text-[10px] text-[#81A1C1] font-mono">
                              {cat.transactionCount} transaksi • <span className="underline underline-offset-2">{isCatExpanded ? "Tutup" : "Lihat"}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-extrabold font-mono text-[#ECEFF4] block">
                              {formatCurrency(cat.totalAmount)}
                            </span>
                            <span className="text-[10px] font-bold text-[#88C0D0] font-mono">
                              {cat.percentage}%
                            </span>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-lg bg-[#2E3440] border border-[#434C5E] flex items-center justify-center text-[#81A1C1] group-hover/cat:text-[#ECEFF4] group-hover/cat:border-[#88C0D0]/40 transition-all ${
                              isCatExpanded ? "rotate-180 text-[#88C0D0] border-[#88C0D0]/40" : ""
                            }`}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </button>

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

                      {/* Category Transactions Details (Expanded) */}
                      {isCatExpanded && (
                        <div className="pt-2 pb-0.5 border-t border-[#434C5E]/50 animate-fade-in space-y-1.5">
                          <div className="flex items-center justify-between px-0.5 text-[10px] font-semibold text-[#81A1C1] uppercase tracking-wider">
                            <span>Riwayat Hari Ini</span>
                            <span className="font-mono">{txList.length} transaksi</span>
                          </div>

                          {txList.length === 0 ? (
                            <p className="text-[11px] text-[#81A1C1] text-center py-2 italic bg-[#1E232A]/50 rounded-xl">
                              Tidak ada rincian transaksi.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {txList.map((tx) => (
                                <div
                                  key={tx.id}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#1E232A]/80 border border-[#434C5E]/40 hover:border-[#88C0D0]/40 transition-all"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className="w-1.5 h-7 rounded-full shrink-0"
                                      style={{
                                        backgroundColor: cat.categoryColor || "#BF616A",
                                      }}
                                    />
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-[#ECEFF4] truncate">
                                        {tx.notes?.trim() ? tx.notes : cat.categoryName}
                                      </p>
                                      <div className="flex items-center gap-1.5 text-[10px] text-[#81A1C1] mt-0.5">
                                        {tx.walletName && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#2E3440] border border-[#434C5E]/60 text-[#D8DEE9] font-medium">
                                            {tx.walletName}
                                          </span>
                                        )}
                                        {tx.createdAt && (
                                          <span className="font-mono text-[#81A1C1]">
                                            {formatTime(tx.createdAt)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0 pl-2">
                                    <span className="text-xs font-extrabold font-mono text-[#BF616A]">
                                      -{formatCurrency(tx.amount)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
