"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, getMonthName } from "@/lib/utils/format";
import {
  ExpenseCategoryBreakdown,
  CategoryBreakdownItem,
} from "@/components/analytics/ExpenseCategoryBreakdown";
import { DailyTrendChart } from "@/components/analytics/DailyTrendChart";
import { TrendingUp, TrendingDown, ArrowLeftRight, Percent } from "lucide-react";

export default function ReportsPage() {
  const { selectedMonth, selectedYear, refreshTrigger } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [netCashflow, setNetCashflow] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    CategoryBreakdownItem[]
  >([]);
  const [dailyTrends, setDailyTrends] = useState<
    Array<{ day: number; expense: number; income: number }>
  >([]);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/analytics/summary?month=${selectedMonth}&year=${selectedYear}`
      );
      if (res.ok) {
        const data = await res.json();
        setMonthlyIncome(data.monthlyIncome || 0);
        setMonthlyExpense(data.monthlyExpense || 0);
        setNetCashflow(data.netCashflow || 0);
        setCategoryBreakdown(data.categoryBreakdown || []);
        setDailyTrends(data.dailyTrends || []);
      }
    } catch (e) {
      console.error("Fetch reports error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, refreshTrigger]);

  const savingsRate =
    monthlyIncome > 0
      ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100)
      : 0;

  return (
    <div className="py-4 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Laporan Keuangan
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Analisis dan tren keuangan bulan {getMonthName(selectedMonth - 1)}{" "}
          {selectedYear}
        </p>
      </div>

      {/* 4-Card Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
            <TrendingUp className="w-4 h-4" /> Total Pemasukan
          </div>
          <p className="text-base sm:text-lg font-bold text-white font-mono truncate">
            {formatCurrency(monthlyIncome)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 mb-1">
            <TrendingDown className="w-4 h-4" /> Total Pengeluaran
          </div>
          <p className="text-base sm:text-lg font-bold text-white font-mono truncate">
            {formatCurrency(monthlyExpense)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 mb-1">
            <ArrowLeftRight className="w-4 h-4" /> Arus Kas Bersih
          </div>
          <p
            className={`text-base sm:text-lg font-bold font-mono truncate ${
              netCashflow >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {netCashflow >= 0 ? "+" : ""}
            {formatCurrency(netCashflow)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 mb-1">
            <Percent className="w-4 h-4" /> Rasio Tabungan
          </div>
          <p
            className={`text-base sm:text-lg font-bold font-mono ${
              savingsRate >= 0 ? "text-purple-300" : "text-red-400"
            }`}
          >
            {savingsRate}%
          </p>
        </div>
      </div>

      {/* Daily Expense Trend Chart */}
      <DailyTrendChart
        dailyTrends={dailyTrends}
        month={selectedMonth}
        year={selectedYear}
      />

      {/* Expense by Category Breakdown */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 px-1">
          Rincian Pengeluaran per Kategori
        </h3>
        <ExpenseCategoryBreakdown
          categories={categoryBreakdown}
          totalExpense={monthlyExpense}
        />
      </div>
    </div>
  );
}
