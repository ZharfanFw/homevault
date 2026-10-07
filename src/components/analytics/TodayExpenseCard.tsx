"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatCurrency, getLocalDateString } from "@/lib/utils/format";
import { CategoryIcon } from "@/lib/utils/icons";
import { ChevronDown, ChevronLeft, ChevronRight, Calendar, RotateCcw, X } from "lucide-react";

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

// Date helper: change date by N days
function changeDateByDays(dateStr: string, days: number): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const nextY = date.getFullYear();
    const nextM = (date.getMonth() + 1).toString().padStart(2, "0");
    const nextD = date.getDate().toString().padStart(2, "0");
    return `${nextY}-${nextM}-${nextD}`;
  } catch {
    return dateStr;
  }
}

function DatePickerModal({
  isOpen,
  onClose,
  selectedDate,
  todayStr,
  onSelectDate,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  todayStr: string;
  onSelectDate: (date: string) => void;
}) {
  const [tempDate, setTempDate] = useState(selectedDate);

  useEffect(() => {
    if (isOpen) {
      setTempDate(selectedDate);
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const yesterdayStr = changeDateByDays(todayStr, -1);
  const threeDaysAgoStr = changeDateByDays(todayStr, -3);
  const sevenDaysAgoStr = changeDateByDays(todayStr, -7);

  const presets = [
    { label: "Hari Ini", date: todayStr },
    { label: "Kemarin", date: yesterdayStr },
    { label: "3 Hari Lalu", date: threeDaysAgoStr },
    { label: "7 Hari Lalu", date: sevenDaysAgoStr },
  ];

  const handleApply = (dateToApply: string) => {
    if (dateToApply && dateToApply <= todayStr) {
      onSelectDate(dateToApply);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#2E3440] border border-[#434C5E] rounded-3xl p-5 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#D8DEE9]/60 hover:text-[#ECEFF4] hover:bg-[#3B4252] rounded-full transition-colors tap-effect"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#88C0D0]/15 text-[#88C0D0] flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#ECEFF4] leading-tight">
              Pilih Tanggal Pengeluaran
            </h3>
            <p className="text-[11px] text-[#81A1C1]">
              Lihat riwayat transaksi harian
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#81A1C1] block mb-1.5">
            Pilihan Cepat
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {presets.map((p) => {
              const isSelected = tempDate === p.date;
              return (
                <button
                  key={p.date}
                  type="button"
                  onClick={() => {
                    setTempDate(p.date);
                    handleApply(p.date);
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center tap-effect ${
                    isSelected
                      ? "bg-[#88C0D0] text-[#2E3440] border-[#88C0D0] shadow-sm font-bold"
                      : "bg-[#242933] text-[#ECEFF4] border-[#434C5E] hover:border-[#88C0D0]/40"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Input */}
        <div className="mb-4">
          <label
            htmlFor="date-picker-manual"
            className="text-[10px] font-bold uppercase tracking-wider text-[#81A1C1] block mb-1.5"
          >
            Pilih Tanggal Kalender
          </label>
          <input
            id="date-picker-manual"
            type="date"
            value={tempDate}
            max={todayStr}
            onChange={(e) => setTempDate(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-[#242933] border border-[#434C5E] text-[#ECEFF4] font-mono text-xs focus:border-[#88C0D0] outline-none transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-[#3B4252] hover:bg-[#434C5E] text-[#D8DEE9] text-xs font-semibold transition-colors tap-effect"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => handleApply(tempDate)}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-bold shadow hover:brightness-110 active:scale-95 transition-all tap-effect"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
}

export function TodayExpenseCard({
  todayData,
  isLoading = false,
}: TodayExpenseCardProps) {
  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dayData, setDayData] = useState<TodayExpenseData | null>(todayData);
  const [isFetchingDate, setIsFetchingDate] = useState(false);
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});

  // When initial todayData arrives or updates from parent, sync if on today
  useEffect(() => {
    if (todayData && selectedDate === todayStr) {
      setDayData(todayData);
    }
  }, [todayData, selectedDate, todayStr]);

  // Fetch daily data when date changes
  const fetchDailyData = useCallback(async (targetDate: string) => {
    try {
      setIsFetchingDate(true);
      const res = await fetch(`/api/analytics/summary?today=${targetDate}&dailyOnly=true`);
      if (res.ok) {
        const json = await res.json();
        if (json.todaySummary) {
          setDayData(json.todaySummary);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data pengeluaran harian:", err);
    } finally {
      setIsFetchingDate(false);
    }
  }, []);

  const handleSelectDate = (newDate: string) => {
    if (!newDate || newDate === selectedDate) return;
    setSelectedDate(newDate);
    fetchDailyData(newDate);
  };

  const handlePrevDay = () => {
    const prevDate = changeDateByDays(selectedDate, -1);
    handleSelectDate(prevDate);
  };

  const handleNextDay = () => {
    if (selectedDate >= todayStr) return;
    const nextDate = changeDateByDays(selectedDate, 1);
    handleSelectDate(nextDate);
  };

  const handleResetToday = () => {
    if (selectedDate === todayStr) return;
    setSelectedDate(todayStr);
    if (todayData) {
      setDayData(todayData);
    } else {
      fetchDailyData(todayStr);
    }
  };

  // Date comparison
  const isToday = selectedDate === todayStr;
  const yesterdayStr = changeDateByDays(todayStr, -1);
  const isYesterday = selectedDate === yesterdayStr;
  const canGoNext = selectedDate < todayStr;

  // Format date readable (e.g. "Rabu, 7 Oktober 2026")
  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return "Hari Ini";
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
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

  if (isLoading && !dayData) {
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

  const totalExpense = dayData?.totalExpense ?? 0;
  const categories = dayData?.categoryBreakdown ?? [];
  const transactionCount = dayData?.transactionCount ?? 0;

  return (
    <div className="space-y-2.5">
      {/* 1. SEPARATE DATE NAVIGATION TOOLBAR */}
      <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
        {/* Left: Navigation Arrow Controls (< and > paired together with comfortable touch target) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handlePrevDay}
            title="Hari Sebelumnya"
            aria-label="Hari Sebelumnya"
            className="w-10 h-10 rounded-xl bg-[#242933] border border-[#434C5E] flex items-center justify-center text-[#D8DEE9] hover:text-[#ECEFF4] hover:bg-[#3B4252] active:scale-95 transition-all tap-effect"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNextDay}
            disabled={!canGoNext}
            title={canGoNext ? "Hari Berikutnya" : "Sudah di tanggal hari ini"}
            aria-label="Hari Berikutnya"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all tap-effect ${
              canGoNext
                ? "bg-[#242933] border border-[#434C5E] text-[#D8DEE9] hover:text-[#ECEFF4] hover:bg-[#3B4252] active:scale-95"
                : "bg-[#242933]/50 border border-[#434C5E]/30 text-[#4C566A]/40 cursor-not-allowed"
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Selected Date Label & Status Badge */}
        <div className="text-center min-w-0 px-1 flex-1">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-[#ECEFF4] truncate">
              {formatDateLabel(selectedDate)}
            </span>
            {isToday ? (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-[#88C0D0]/15 text-[#88C0D0] border border-[#88C0D0]/30 uppercase tracking-wider shrink-0">
                Hari Ini
              </span>
            ) : isYesterday ? (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-[#EBCB8B]/15 text-[#EBCB8B] border border-[#EBCB8B]/30 uppercase tracking-wider shrink-0">
                Kemarin
              </span>
            ) : null}
          </div>
        </div>

        {/* Right: Calendar Date Picker & Quick Reset (Separated on the right side) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isToday && (
            <button
              type="button"
              onClick={handleResetToday}
              title="Kembali ke hari ini"
              className="h-10 px-2 sm:px-2.5 rounded-xl text-[11px] font-bold bg-[#88C0D0]/10 text-[#88C0D0] border border-[#88C0D0]/30 hover:bg-[#88C0D0]/20 active:scale-95 transition-all flex items-center gap-1 tap-effect"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hari Ini</span>
            </button>
          )}

          {/* Dedicated Calendar Button that opens DatePickerModal */}
          <button
            type="button"
            onClick={() => setIsDatePickerModalOpen(true)}
            title="Pilih Tanggal di Kalender"
            aria-label="Pilih Tanggal di Kalender"
            className="h-10 px-2.5 sm:px-3 rounded-xl bg-[#242933] border border-[#434C5E] text-[#88C0D0] hover:text-[#ECEFF4] hover:bg-[#3B4252] active:scale-95 transition-all flex items-center gap-1.5 tap-effect shadow-inner"
          >
            <Calendar className="w-4 h-4 text-[#88C0D0]" />
            <span className="text-xs font-semibold hidden sm:inline">Kalender</span>
          </button>
        </div>
      </div>

      {/* 2. PURE CLICKABLE EXPENSE CARD (NO DATE CONTROLS INSIDE) */}
      <div className="overflow-hidden rounded-3xl bg-[#2E3440] border border-[#434C5E] hover:border-[#88C0D0]/50 transition-all shadow-md group">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full p-4 sm:p-5 text-left transition-colors hover:bg-[#353C4A]/40 tap-effect"
          aria-expanded={isExpanded}
        >
          {/* Top Row: Title + Date vs Amount */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#88C0D0]/15 border border-[#88C0D0]/30 text-[#88C0D0] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#81A1C1] block leading-none">
                  {isToday
                    ? "Total Pengeluaran Hari Ini"
                    : isYesterday
                    ? "Total Pengeluaran Kemarin"
                    : "Total Pengeluaran Harian"}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[#ECEFF4] mt-1 block truncate">
                  {formatDateLabel(selectedDate)}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div
                className={`text-lg sm:text-xl font-black font-mono text-[#ECEFF4] tracking-tight transition-opacity ${
                  isFetchingDate ? "opacity-50 animate-pulse" : ""
                }`}
              >
                {formatCurrency(totalExpense)}
              </div>
              <span className="text-[10px] font-mono text-[#81A1C1]">
                {isFetchingDate
                  ? "Memuat..."
                  : totalExpense > 0
                  ? `${transactionCount} transaksi`
                  : "Nihil"}
              </span>
            </div>
          </div>

          {/* Bottom Helper Bar & Action Toggle */}
          <div className="mt-3 pt-2.5 border-t border-[#434C5E]/50 flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#81A1C1] truncate">
              {isFetchingDate
                ? "Memuat riwayat harian..."
                : totalExpense > 0
                ? `${categories.length} kategori pengeluaran • Klik untuk rincian`
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
                Belum ada transaksi pengeluaran pada tanggal ini.
              </p>
              <p className="text-[11px] text-[#D8DEE9]/70">
                {formatDateLabel(selectedDate)}
              </p>
            </div>
          ) : (
            <>
              {/* Multi-Segment Proportional Visual Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-[#81A1C1]">
                  <span>
                    {isToday
                      ? "Proporsi Kategori Hari Ini"
                      : isYesterday
                      ? "Proporsi Kategori Kemarin"
                      : "Proporsi Kategori"}
                  </span>
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
                            <span>
                              {isToday
                                ? "Riwayat Hari Ini"
                                : isYesterday
                                ? "Riwayat Kemarin"
                                : `Riwayat (${formatDateLabel(selectedDate)})`}
                            </span>
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

    {/* Date Picker Modal */}
    <DatePickerModal
      isOpen={isDatePickerModalOpen}
      onClose={() => setIsDatePickerModalOpen(false)}
      selectedDate={selectedDate}
      todayStr={todayStr}
      onSelectDate={handleSelectDate}
    />
  </div>
);
}
