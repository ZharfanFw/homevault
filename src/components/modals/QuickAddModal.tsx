"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Check, Calendar, StickyNote } from "lucide-react";
import { CategoryIcon } from "@/lib/utils/icons";

interface WalletOption {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
  currentBalance: number;
}

interface CategoryOption {
  id: string;
  name: string;
  type: "EXPENSE" | "INCOME";
  icon: string;
  color: string;
}

export function QuickAddModal() {
  const {
    isQuickAddOpen,
    closeQuickAdd,
    quickAddDefaultType,
    triggerRefresh,
  } = useApp();

  const [type, setType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  const [amountStr, setAmountStr] = useState<string>("");
  const [walletId, setWalletId] = useState<string>("");
  const [destinationWalletId, setDestinationWalletId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (isQuickAddOpen) {
      setType(quickAddDefaultType);
      setAmountStr("");
      setNotes("");
      setError("");
      setDate(new Date().toISOString().split("T")[0]);

      // Fetch options
      setIsLoadingOptions(true);
      Promise.all([
        fetch("/api/wallets").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
      ])
        .then(([walletsData, catsData]) => {
          const fetchedWallets = walletsData.wallets || [];
          const fetchedCats = catsData.categories || [];

          setWallets(fetchedWallets);
          setCategories(fetchedCats);

          if (fetchedWallets.length > 0) {
            setWalletId(fetchedWallets[0].id);
            if (fetchedWallets.length > 1) {
              setDestinationWalletId(fetchedWallets[1].id);
            }
          }

          const defaultCat = fetchedCats.find(
            (c: CategoryOption) => c.type === quickAddDefaultType
          );
          if (defaultCat) {
            setCategoryId(defaultCat.id);
          }
        })
        .finally(() => setIsLoadingOptions(false));
    }
  }, [isQuickAddOpen, quickAddDefaultType]);

  // Update selected category when transaction type changes
  useEffect(() => {
    if (type !== "TRANSFER") {
      const match = categories.find((c) => c.type === type);
      if (match) setCategoryId(match.id);
    }
  }, [type, categories]);

  if (!isQuickAddOpen) return null;

  const handleAddAmount = (addValue: number) => {
    const current = parseInt(amountStr || "0", 10);
    setAmountStr((current + addValue).toString());
  };

  const handleAppendZeros = () => {
    if (!amountStr) return;
    setAmountStr((prev) => prev + "000");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amount = parseInt(amountStr, 10);
    if (!amount || amount <= 0) {
      setError("Masukkan nominal transaksi yang valid.");
      return;
    }

    if (!walletId) {
      setError("Pilih dompet transaksi.");
      return;
    }

    if (type === "TRANSFER") {
      if (!destinationWalletId) {
        setError("Pilih dompet tujuan.");
        return;
      }
      if (walletId === destinationWalletId) {
        setError("Dompet asal dan tujuan tidak boleh sama.");
        return;
      }
    } else {
      if (!categoryId) {
        setError("Pilih kategori transaksi.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount,
          walletId,
          destinationWalletId: type === "TRANSFER" ? destinationWalletId : undefined,
          categoryId: type === "TRANSFER" ? undefined : categoryId,
          date,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mencatat transaksi.");
      } else {
        triggerRefresh();
        closeQuickAdd();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Catat Transaksi</h2>
          </div>
          <button
            onClick={closeQuickAdd}
            aria-label="Tutup"
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 tap-effect"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold tap-effect transition-all ${
                type === "EXPENSE"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold tap-effect transition-all ${
                type === "INCOME"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setType("TRANSFER")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold tap-effect transition-all ${
                type === "TRANSFER"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              Transfer
            </button>
          </div>

          {/* Amount Display & Input */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-center">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Nominal
            </label>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xl font-bold text-slate-400">Rp</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full text-center text-3xl font-extrabold bg-transparent text-white focus:outline-none placeholder-slate-700 font-mono"
                autoFocus
              />
            </div>

            {/* Quick Increment Chips */}
            <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-900 flex-wrap">
              <button
                type="button"
                onClick={() => handleAddAmount(10000)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 tap-effect"
              >
                +10rb
              </button>
              <button
                type="button"
                onClick={() => handleAddAmount(50000)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 tap-effect"
              >
                +50rb
              </button>
              <button
                type="button"
                onClick={() => handleAddAmount(100000)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 tap-effect"
              >
                +100rb
              </button>
              <button
                type="button"
                onClick={handleAppendZeros}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 tap-effect"
              >
                000
              </button>
              {amountStr && (
                <button
                  type="button"
                  onClick={() => setAmountStr("")}
                  className="px-2 py-1 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 tap-effect"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Wallets Selection */}
          {type === "TRANSFER" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Dari Dompet
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Ke Dompet
                </label>
                <select
                  value={destinationWalletId}
                  onChange={(e) => setDestinationWalletId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {wallets
                    .filter((w) => w.id !== walletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Dompet
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {wallets.map((w) => {
                  const isSelected = walletId === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWalletId(w.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left tap-effect transition-all ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 text-white"
                          : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: w.color }}
                      >
                        <CategoryIcon name={w.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium truncate">
                        {w.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categories Grid (for EXPENSE and INCOME) */}
          {type !== "TRANSFER" && (
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Kategori
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto no-scrollbar p-0.5">
                {filteredCategories.map((c) => {
                  const isSelected = categoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left tap-effect transition-all ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500"
                          : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: c.color }}
                      >
                        <CategoryIcon name={c.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium truncate">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1.5">
                <StickyNote className="w-3.5 h-3.5 text-slate-400" /> Catatan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Makan siang bareng"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-600"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoadingOptions}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 tap-effect flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Simpan Transaksi
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
