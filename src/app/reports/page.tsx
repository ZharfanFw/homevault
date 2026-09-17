"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, getMonthName } from "@/lib/utils/format";
import { formatDateRangeLabel } from "@/lib/utils/dateRange";
import {
  ExpenseCategoryBreakdown,
  CategoryBreakdownItem,
} from "@/components/analytics/ExpenseCategoryBreakdown";
import { DailyTrendChart } from "@/components/analytics/DailyTrendChart";
import { AnnualTrendChart } from "@/components/analytics/AnnualTrendChart";
import { DateRangePickerModal } from "@/components/analytics/DateRangePickerModal";
import { CategoryIcon } from "@/lib/utils/icons";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Percent,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { MonthlyAnnualData, PeakMonthDetails } from "@/app/api/analytics/annual/route";

export default function ReportsPage() {
  const { selectedMonth, selectedYear, refreshTrigger } = useApp();

  const [viewMode, setViewMode] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");

  // Monthly / Custom Range state
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);

  const [isLoadingMonthly, setIsLoadingMonthly] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [netCashflow, setNetCashflow] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [dailyTrends, setDailyTrends] = useState<
    Array<{ day: number; expense: number; income: number }>
  >([]);

  // Annual state
  const [annualYear, setAnnualYear] = useState<number>(selectedYear || new Date().getFullYear());
  const [isLoadingAnnual, setIsLoadingAnnual] = useState(true);
  const [annualData, setAnnualData] = useState<{
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    annualSavingsRate: number;
    elapsedMonths: number;
    averageMonthlyExpense: number;
    averageMonthlyIncome: number;
    peakMonth: PeakMonthDetails | null;
    monthlyData: MonthlyAnnualData[];
    categoryBreakdown: CategoryBreakdownItem[];
  } | null>(null);

  // 1. Fetch Monthly Reports
  const fetchMonthlyReports = useCallback(async () => {
    try {
      setIsLoadingMonthly(true);
      const params = new URLSearchParams();
      if (customRange) {
        params.set("from", customRange.from);
        params.set("to", customRange.to);
      } else {
        params.set("month", selectedMonth.toString());
        params.set("year", selectedYear.toString());
      }

      const res = await fetch(`/api/analytics/summary?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyIncome(data.monthlyIncome || 0);
        setMonthlyExpense(data.monthlyExpense || 0);
        setNetCashflow(data.netCashflow || 0);
        setCategoryBreakdown(data.categoryBreakdown || []);
        setDailyTrends(data.dailyTrends || []);
      }
    } catch (e) {
      console.error("Fetch monthly reports error:", e);
    } finally {
      setIsLoadingMonthly(false);
    }
  }, [selectedMonth, selectedYear, customRange]);

  // 2. Fetch Annual Reports
  const fetchAnnualReports = useCallback(async () => {
    try {
      setIsLoadingAnnual(true);
      const res = await fetch(`/api/analytics/annual?year=${annualYear}`);
      if (res.ok) {
        const data = await res.json();
        setAnnualData(data);
      }
    } catch (e) {
      console.error("Fetch annual reports error:", e);
    } finally {
      setIsLoadingAnnual(false);
    }
  }, [annualYear]);

  useEffect(() => {
    if (viewMode === "MONTHLY") {
      fetchMonthlyReports();
    } else {
      fetchAnnualReports();
    }
  }, [viewMode, fetchMonthlyReports, fetchAnnualReports, refreshTrigger]);

  const savingsRate =
    monthlyIncome > 0
      ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100)
      : 0;

  const currentPeriodTitle = customRange
    ? formatDateRangeLabel(customRange.from, customRange.to)
    : `${getMonthName(selectedMonth - 1)} ${selectedYear}`;

  return (
    <div className="py-4 space-y-6">
      {/* Page Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#ECEFF4] tracking-tight">
            Laporan Keuangan
          </h2>
          <p className="text-xs text-[#81A1C1] mt-0.5 font-medium">
            {viewMode === "MONTHLY"
              ? "Analisis berkala & perbandingan arus kas"
              : `Kilasan tahunan dan tren 12 bulan (${annualYear})`}
          </p>
        </div>

        {/* Tab Switcher: Bulanan vs Tahunan */}
        <div className="flex p-1 bg-[#2E3440] border border-[#434C5E] rounded-2xl text-xs shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("MONTHLY")}
            className={`py-1.5 px-3.5 rounded-xl font-bold transition-all ${
              viewMode === "MONTHLY"
                ? "bg-[#88C0D0] text-[#2E3440] shadow-sm"
                : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
            }`}
          >
            Laporan Bulanan
          </button>
          <button
            onClick={() => setViewMode("ANNUAL")}
            className={`py-1.5 px-3.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "ANNUAL"
                ? "bg-[#88C0D0] text-[#2E3440] shadow-sm"
                : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tahunan</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW MODE: MONTHLY / CUSTOM RANGE                                      */}
      {/* ========================================================================= */}
      {viewMode === "MONTHLY" && (
        <div className="space-y-6 animate-fade-in">
          {/* Active Period & Filter Button Bar */}
          <div className="p-3.5 rounded-2xl bg-[#2E3440] border border-[#434C5E] flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#88C0D0]" />
              <span className="text-xs font-bold text-[#ECEFF4]">
                Periode: <span className="font-mono text-[#88C0D0]">{currentPeriodTitle}</span>
              </span>
              {customRange && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A3BE8C]/20 text-[#A3BE8C] border border-[#A3BE8C]/30">
                  Kustom
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {customRange && (
                <button
                  onClick={() => setCustomRange(null)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#3B4252] hover:bg-[#434C5E] text-[#D8DEE9] text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Kembali ke bulan kalender"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}

              <button
                onClick={() => setIsRangeModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-bold shadow hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Ubah Rentang</span>
              </button>
            </div>
          </div>

          {/* Content: Loading vs Loaded */}
          {isLoadingMonthly ? (
            <div className="p-12 text-center bg-[#2E3440]/60 border border-[#434C5E] rounded-3xl">
              <p className="text-xs text-[#81A1C1] animate-pulse font-medium">
                Memuat data laporan...
              </p>
            </div>
          ) : (
            <>
              {/* 4-Card Summary Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#A3BE8C] mb-1">
                    <TrendingUp className="w-4 h-4 stroke-[2.5]" /> Total Pemasukan
                  </div>
                  <p className="text-base sm:text-lg font-extrabold text-[#ECEFF4] font-mono truncate">
                    {formatCurrency(monthlyIncome)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#BF616A] mb-1">
                    <TrendingDown className="w-4 h-4 stroke-[2.5]" /> Total Pengeluaran
                  </div>
                  <p className="text-base sm:text-lg font-extrabold text-[#ECEFF4] font-mono truncate">
                    {formatCurrency(monthlyExpense)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#88C0D0] mb-1">
                    <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" /> Arus Kas Bersih
                  </div>
                  <p
                    className={`text-base sm:text-lg font-extrabold font-mono truncate ${
                      netCashflow >= 0 ? "text-[#A3BE8C]" : "text-[#BF616A]"
                    }`}
                  >
                    {netCashflow >= 0 ? "+" : ""}
                    {formatCurrency(netCashflow)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#B48EAD] mb-1">
                    <Percent className="w-4 h-4 stroke-[2.5]" /> Rasio Tabungan
                  </div>
                  <p
                    className={`text-base sm:text-lg font-extrabold font-mono ${
                      savingsRate >= 0 ? "text-[#B48EAD]" : "text-[#BF616A]"
                    }`}
                  >
                    {savingsRate}%
                  </p>
                </div>
              </div>

              {/* Daily Trend Chart */}
              <DailyTrendChart
                dailyTrends={dailyTrends}
                month={selectedMonth}
                year={selectedYear}
              />

              {/* Category Breakdown */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#81A1C1] mb-3 px-1">
                  Rincian Pengeluaran per Kategori
                </h3>
                <ExpenseCategoryBreakdown
                  categories={categoryBreakdown}
                  totalExpense={monthlyExpense}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW MODE: ANNUAL OVERVIEW (YEAR-IN-REVIEW)                           */}
      {/* ========================================================================= */}
      {viewMode === "ANNUAL" && (
        <div className="space-y-6 animate-fade-in">
          {/* Year Selector */}
          <div className="p-3.5 rounded-2xl bg-[#2E3440] border border-[#434C5E] flex items-center justify-between shadow-sm">
            <button
              onClick={() => setAnnualYear(annualYear - 1)}
              className="p-2 rounded-xl text-[#D8DEE9] hover:text-[#ECEFF4] hover:bg-[#3B4252] tap-effect transition-colors"
              title="Tahun Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-[11px] font-bold text-[#81A1C1] uppercase tracking-wider block">
                Laporan Tahunan
              </span>
              <span className="text-lg font-extrabold font-mono text-[#ECEFF4]">
                Tahun {annualYear}
              </span>
            </div>

            <button
              onClick={() => setAnnualYear(annualYear + 1)}
              className="p-2 rounded-xl text-[#D8DEE9] hover:text-[#ECEFF4] hover:bg-[#3B4252] tap-effect transition-colors"
              title="Tahun Berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {isLoadingAnnual || !annualData ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#88C0D0]/20 border-t-[#88C0D0] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Annual 5-Card KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#A3BE8C] mb-1">
                    <TrendingUp className="w-4 h-4" /> Total Masuk {annualYear}
                  </div>
                  <p className="text-base sm:text-lg font-extrabold text-[#ECEFF4] font-mono truncate">
                    {formatCurrency(annualData.totalIncome)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#BF616A] mb-1">
                    <TrendingDown className="w-4 h-4" /> Total Keluar {annualYear}
                  </div>
                  <p className="text-base sm:text-lg font-extrabold text-[#ECEFF4] font-mono truncate">
                    {formatCurrency(annualData.totalExpense)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#88C0D0] mb-1">
                    <ArrowLeftRight className="w-4 h-4" /> Net Arus Kas
                  </div>
                  <p
                    className={`text-base sm:text-lg font-extrabold font-mono truncate ${
                      annualData.netSavings >= 0 ? "text-[#A3BE8C]" : "text-[#BF616A]"
                    }`}
                  >
                    {annualData.netSavings >= 0 ? "+" : ""}
                    {formatCurrency(annualData.netSavings)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
                  <div className="text-xs font-bold text-[#EBCB8B] mb-1">
                    Rata-rata Keluar / Bln
                  </div>
                  <p className="text-base sm:text-lg font-extrabold text-[#ECEFF4] font-mono truncate">
                    {formatCurrency(annualData.averageMonthlyExpense)}
                  </p>
                  <span className="text-[10px] text-[#81A1C1]">
                    ({annualData.elapsedMonths} bulan terhitung)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#B48EAD] mb-1">
                    <Percent className="w-4 h-4" /> Rasio Tabungan Tahunan
                  </div>
                  <p
                    className={`text-base sm:text-lg font-extrabold font-mono ${
                      annualData.annualSavingsRate >= 0 ? "text-[#B48EAD]" : "text-[#BF616A]"
                    }`}
                  >
                    {annualData.annualSavingsRate}%
                  </p>
                  <span className="text-[10px] text-[#81A1C1]">
                    dari total pemasukan
                  </span>
                </div>
              </div>

              {/* Highlight Card: Bulan Paling Boros (Peak Expense) */}
              {annualData.peakMonth && annualData.peakMonth.expense > 0 && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-[#2E3440] via-[#3B4252] to-[#2E3440] border border-[#BF616A]/40 shadow-lg relative overflow-hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#BF616A]/20 text-[#BF616A] flex items-center justify-center shrink-0 border border-[#BF616A]/30">
                        <Flame className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-[#BF616A] uppercase tracking-wider block">
                          Bulan Paling Boros
                        </span>
                        <h4 className="text-base sm:text-lg font-extrabold text-[#ECEFF4] leading-tight">
                          {annualData.peakMonth.monthName} {annualYear}
                        </h4>
                        <p className="text-xs font-mono font-bold text-[#BF616A] mt-0.5">
                          Pengeluaran: {formatCurrency(annualData.peakMonth.expense)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Top 3 Categories in Peak Month */}
                  {annualData.peakMonth.topCategories.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#434C5E]/60 space-y-2">
                      <span className="text-[11px] font-bold text-[#81A1C1] uppercase tracking-wider block">
                        3 Pengeluaran Terbesar di Bulan Tersebut:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {annualData.peakMonth.topCategories.map((cat, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-[#242933]/70 border border-[#434C5E]/50 flex items-center gap-2.5 text-xs"
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2E3440] shrink-0"
                              style={{ backgroundColor: cat.categoryColor || "#88C0D0" }}
                            >
                              <CategoryIcon name={cat.categoryIcon} className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate flex-1">
                              <span className="font-bold text-[#ECEFF4] block truncate">
                                {cat.categoryName}
                              </span>
                              <span className="text-[11px] font-mono text-[#D8DEE9]/80">
                                {formatCurrency(cat.amount)} ({cat.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 12-Month Annual Trend Chart */}
              <AnnualTrendChart
                monthlyData={annualData.monthlyData}
                year={annualYear}
              />

              {/* Full Year Category Breakdown */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#81A1C1] mb-3 px-1">
                  Kategori Pengeluaran Terbesar Sepanjang {annualYear}
                </h3>
                <ExpenseCategoryBreakdown
                  categories={annualData.categoryBreakdown}
                  totalExpense={annualData.totalExpense}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Date Range Modal */}
      <DateRangePickerModal
        isOpen={isRangeModalOpen}
        onClose={() => setIsRangeModalOpen(false)}
        currentFrom={customRange?.from}
        currentTo={customRange?.to}
        onApply={(from, to) => setCustomRange({ from, to })}
        onReset={() => setCustomRange(null)}
      />
    </div>
  );
}
