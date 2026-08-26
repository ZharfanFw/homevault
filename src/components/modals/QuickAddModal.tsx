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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#242933]/80 backdrop-blur-md transition-opacity">
      <div
        className="w-full max-w-lg bg-[#2E3440] border-t sm:border border-[#434C5E] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#434C5E]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#ECEFF4]">Catat Transaksi</h2>
          </div>
          <button
            onClick={closeQuickAdd}
            aria-label="Tutup"
            className="p-1.5 text-[#D8DEE9] hover:text-[#ECEFF4] rounded-full bg-[#3B4252] hover:bg-[#434C5E] tap-effect"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 text-xs bg-[#BF616A]/15 border border-[#BF616A]/30 text-[#BF616A] rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#242933] border border-[#434C5E] rounded-2xl">
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold tap-effect transition-all ${
                type === "EXPENSE"
                  ? "bg-[#BF616A]/20 text-[#BF616A] border border-[#BF616A]/40 shadow-sm"
                  : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold tap-effect transition-all ${
                type === "INCOME"
                  ? "bg-[#A3BE8C]/20 text-[#A3BE8C] border border-[#A3BE8C]/40 shadow-sm"
                  : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setType("TRANSFER")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold tap-effect transition-all ${
                type === "TRANSFER"
                  ? "bg-[#88C0D0]/20 text-[#88C0D0] border border-[#88C0D0]/40 shadow-sm"
                  : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              Transfer
            </button>
          </div>

          {/* Amount Display & Input */}
          <div className="bg-[#242933] border border-[#434C5E] rounded-2xl p-4 text-center">
            <label className="text-[11px] font-bold text-[#81A1C1] uppercase tracking-wider block mb-1">
              Nominal Transaksi
            </label>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xl font-extrabold text-[#81A1C1] font-mono">Rp</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full text-center text-3xl sm:text-4xl font-extrabold bg-transparent text-[#ECEFF4] focus:outline-none placeholder-[#4C566A] font-mono"
                autoFocus
              />
            </div>

            {/* Quick Increment Chips */}
            <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-[#3B4252] flex-wrap">
              <button
                type="button"
                onClick={() => handleAddAmount(10000)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#3B4252] hover:bg-[#434C5E] text-[#D8DEE9] tap-effect"
              >
                +10rb
              </button>
              <button
                type="button"
                onClick={() => handleAddAmount(50000)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#3B4252] hover:bg-[#434C5E] text-[#D8DEE9] tap-effect"
              >
                +50rb
              </button>
              <button
                type="button"
                onClick={() => handleAddAmount(100000)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#3B4252] hover:bg-[#434C5E] text-[#D8DEE9] tap-effect"
              >
                +100rb
              </button>
              <button
                type="button"
                onClick={handleAppendZeros}
                className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-[#88C0D0]/20 hover:bg-[#88C0D0]/30 text-[#88C0D0] border border-[#88C0D0]/30 tap-effect font-mono"
              >
                000
              </button>
              {amountStr && (
                <button
                  type="button"
                  onClick={() => setAmountStr("")}
                  className="px-2 py-1 text-xs font-bold rounded-lg bg-[#BF616A]/20 text-[#BF616A] tap-effect"
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
                <label className="text-xs font-semibold text-[#D8DEE9] block mb-1.5">
                  Dari Dompet
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2.5 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#D8DEE9] block mb-1.5">
                  Ke Dompet
                </label>
                <select
                  value={destinationWalletId}
                  onChange={(e) => setDestinationWalletId(e.target.value)}
                  className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2.5 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none"
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
              <label className="text-xs font-semibold text-[#D8DEE9] block mb-1.5">
                Dompet / Rekening
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
                          ? "bg-[#88C0D0]/20 border-[#88C0D0] text-[#ECEFF4] ring-1 ring-[#88C0D0]"
                          : "bg-[#242933] border-[#434C5E] text-[#D8DEE9] hover:border-[#81A1C1]"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2E3440] shrink-0 font-bold"
                        style={{ backgroundColor: w.color }}
                      >
                        <CategoryIcon name={w.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold truncate">
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
              <label className="text-xs font-semibold text-[#D8DEE9] block mb-1.5">
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
                          ? "bg-[#88C0D0]/20 border-[#88C0D0] text-[#ECEFF4] ring-1 ring-[#88C0D0]"
                          : "bg-[#242933] border-[#434C5E] text-[#D8DEE9] hover:border-[#81A1C1]"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2E3440] shrink-0"
                        style={{ backgroundColor: c.color }}
                      >
                        <CategoryIcon name={c.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold truncate">
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
              <label className="text-xs font-semibold text-[#D8DEE9] flex items-center gap-1 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#81A1C1]" /> Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#D8DEE9] flex items-center gap-1 mb-1.5">
                <StickyNote className="w-3.5 h-3.5 text-[#81A1C1]" /> Catatan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Makan siang bareng"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none placeholder-[#4C566A]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoadingOptions}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] hover:from-[#4C566A] hover:to-[#81A1C1] text-[#2E3440] font-extrabold text-sm shadow-lg shadow-[#88C0D0]/25 tap-effect flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-[#2E3440]/30 border-t-[#2E3440] rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5 stroke-[2.8]" />
                Simpan Transaksi
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
