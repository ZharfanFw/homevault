"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate, formatFullDate } from "@/lib/utils/format";
import { CategoryIcon } from "@/lib/utils/icons";
import {
  Search,
  Filter,
  ArrowLeftRight,
  Trash2,
  Calendar,
  X,
} from "lucide-react";

interface TransactionItem {
  id: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: number;
  date: string;
  notes?: string | null;
  walletId: string;
  walletName?: string | null;
  walletColor?: string | null;
  destinationWalletName?: string | null;
  destinationWalletColor?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  categoryColor?: string | null;
}

export default function TransactionsPage() {
  const { selectedMonth, selectedYear, refreshTrigger, triggerRefresh } = useApp();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [wallets, setWallets] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("month", selectedMonth.toString());
      params.set("year", selectedYear.toString());
      if (search.trim()) params.set("search", search.trim());
      if (selectedType) params.set("type", selectedType);
      if (selectedWalletId) params.set("walletId", selectedWalletId);
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
      params.set("limit", "100");

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error("Fetch transactions error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedMonth,
    selectedYear,
    search,
    selectedType,
    selectedWalletId,
    selectedCategoryId,
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/wallets").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([wData, cData]) => {
      setWallets(wData.wallets || []);
      setCategories(cData.categories || []);
    });
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerRefresh();
      }
    } catch (e) {
      console.error("Delete transaction error:", e);
    }
  };

  // Group transactions by date
  const groupedTransactions: Record<string, TransactionItem[]> = {};
  for (const t of transactions) {
    if (!groupedTransactions[t.date]) {
      groupedTransactions[t.date] = [];
    }
    groupedTransactions[t.date].push(t);
  }

  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="py-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Riwayat Transaksi
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Daftar seluruh mutasi keuangan
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari transaksi berdasarkan catatan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {/* Type pills */}
        <button
          onClick={() => setSelectedType("")}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold tap-effect border ${
            selectedType === ""
              ? "bg-blue-600 text-white border-blue-500"
              : "bg-slate-900 text-slate-400 border-slate-800"
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setSelectedType("EXPENSE")}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold tap-effect border ${
            selectedType === "EXPENSE"
              ? "bg-red-500/20 text-red-400 border-red-500/40"
              : "bg-slate-900 text-slate-400 border-slate-800"
          }`}
        >
          Pengeluaran
        </button>
        <button
          onClick={() => setSelectedType("INCOME")}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold tap-effect border ${
            selectedType === "INCOME"
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              : "bg-slate-900 text-slate-400 border-slate-800"
          }`}
        >
          Pemasukan
        </button>
        <button
          onClick={() => setSelectedType("TRANSFER")}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold tap-effect border ${
            selectedType === "TRANSFER"
              ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
              : "bg-slate-900 text-slate-400 border-slate-800"
          }`}
        >
          Transfer
        </button>

        {/* Wallet Dropdown Filter */}
        <select
          value={selectedWalletId}
          onChange={(e) => setSelectedWalletId(e.target.value)}
          className="shrink-0 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="">Semua Dompet</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* Transactions Grouped by Date */}
      {sortedDates.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl mt-4">
          <p className="text-xs text-slate-500">
            Tidak ada transaksi yang cocok dengan kriteria pencarian.
          </p>
        </div>
      ) : (
        <div className="space-y-5 mt-2">
          {sortedDates.map((dateKey) => {
            const dayTransactions = groupedTransactions[dateKey];
            const dayExpense = dayTransactions
              .filter((t) => t.type === "EXPENSE")
              .reduce((acc, t) => acc + t.amount, 0);

            return (
              <div key={dateKey} className="space-y-2">
                {/* Date Header with Daily Subtotal */}
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="font-bold text-slate-300">
                    {formatFullDate(dateKey)}
                  </span>
                  {dayExpense > 0 && (
                    <span className="font-mono text-slate-500 text-[11px]">
                      Pengeluaran: -{formatCurrency(dayExpense)}
                    </span>
                  )}
                </div>

                {/* Day Transactions List */}
                <div className="space-y-2">
                  {dayTransactions.map((tx) => {
                    const isExpense = tx.type === "EXPENSE";
                    const isIncome = tx.type === "INCOME";
                    const isTransfer = tx.type === "TRANSFER";

                    const iconName = isTransfer
                      ? "arrow-left-right"
                      : tx.categoryIcon || "tag";
                    const iconBg = isTransfer
                      ? "#3b82f6"
                      : isIncome
                      ? tx.categoryColor || "#10b981"
                      : tx.categoryColor || "#ef4444";

                    return (
                      <div
                        key={tx.id}
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: iconBg }}
                          >
                            {isTransfer ? (
                              <ArrowLeftRight className="w-5 h-5" />
                            ) : (
                              <CategoryIcon
                                name={iconName}
                                className="w-5 h-5"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-white truncate">
                              {isTransfer
                                ? `Transfer ke ${tx.destinationWalletName || "Dompet"}`
                                : tx.categoryName || "Transaksi"}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <span className="truncate">
                                {tx.walletName || "Dompet"}
                              </span>
                            </div>
                            {tx.notes && (
                              <p className="text-[10px] text-slate-500 truncate mt-0.5 italic">
                                &ldquo;{tx.notes}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 ml-3">
                          <span
                            className={`text-xs sm:text-sm font-bold font-mono ${
                              isExpense
                                ? "text-red-400"
                                : isIncome
                                ? "text-emerald-400"
                                : "text-blue-400"
                            }`}
                          >
                            {isExpense ? "-" : isIncome ? "+" : ""}
                            {formatCurrency(tx.amount)}
                          </span>

                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1 text-slate-500 hover:text-red-400 rounded-lg tap-effect"
                            aria-label="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
