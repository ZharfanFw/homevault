"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, StickyNote, Calendar } from "lucide-react";
import { CategoryIcon } from "@/lib/utils/icons";
import { parseAmountInput, formatAmountInput } from "@/lib/utils/format";

export interface TransactionDetail {
  id: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: number;
  date: string;
  notes?: string | null;
  walletId: string;
  destinationWalletId?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  walletName?: string | null;
  destinationWalletName?: string | null;
}

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionDetail | null;
  onSuccess: () => void;
  onDelete?: (id: string) => void;
}

export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  onSuccess,
  onDelete,
}: EditTransactionModalProps) {
  const [type, setType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  const [amountStr, setAmountStr] = useState<string>("");
  const [walletId, setWalletId] = useState("");
  const [destinationWalletId, setDestinationWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const [wallets, setWallets] = useState<
    Array<{ id: string; name: string; color: string; icon: string }>
  >([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; type: string; color: string; icon: string }>
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Fetch wallets and categories
      Promise.all([
        fetch("/api/wallets").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
      ]).then(([wData, cData]) => {
        setWallets(wData.wallets || []);
        setCategories(cData.categories || []);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (transaction && isOpen) {
      setType(transaction.type);
      setAmountStr(formatAmountInput(transaction.amount));
      setWalletId(transaction.walletId);
      setDestinationWalletId(transaction.destinationWalletId || "");
      setCategoryId(transaction.categoryId || "");
      setDate(transaction.date);
      setNotes(transaction.notes || "");
      setError("");
    }
  }, [transaction, isOpen]);

  if (!isOpen || !transaction) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleAddAmount = (add: number) => {
    const current = parseAmountInput(amountStr);
    const newAmount = current + add;
    setAmountStr(newAmount > 0 ? formatAmountInput(newAmount) : "");
  };

  const handleAppendZeros = () => {
    const current = parseAmountInput(amountStr);
    if (!current) return;
    const newAmount = current * 1000;
    setAmountStr(formatAmountInput(newAmount));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseAmountInput(raw);
    setAmountStr(raw ? formatAmountInput(parsed) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amount = parseAmountInput(amountStr);
    if (!amount || amount <= 0) {
      setError("Masukkan nominal yang valid.");
      return;
    }

    if (!walletId) {
      setError("Pilih dompet transaksi.");
      return;
    }

    if (type === "TRANSFER") {
      if (!destinationWalletId) {
        setError("Pilih dompet tujuan transfer.");
        return;
      }
      if (destinationWalletId === walletId) {
        setError("Dompet asal dan dompet tujuan tidak boleh sama.");
        return;
      }
    } else {
      if (!categoryId) {
        setError("Pilih kategori transaksi.");
        return;
      }
    }

    if (!date) {
      setError("Pilih tanggal transaksi.");
      return;
    }

    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        type,
        amount,
        walletId,
        date,
        notes: notes.trim() || null,
      };

      if (type === "TRANSFER") {
        payload.destinationWalletId = destinationWalletId;
        payload.categoryId = null;
      } else {
        payload.categoryId = categoryId;
        payload.destinationWalletId = null;
      }

      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memperbarui transaksi.");
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      return;
    }

    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal menghapus transaksi.");
      } else {
        if (onDelete) {
          onDelete(transaction.id);
        }
        onSuccess();
        onClose();
      }
    } catch {
      setError("Terjadi kesalahan jaringan saat menghapus.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#242933]/80 backdrop-blur-md">
      <div
        className="w-full max-w-lg bg-[#2E3440] border-t sm:border border-[#434C5E] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#434C5E]">
          <h3 className="text-base font-bold text-[#ECEFF4]">
            Ubah Transaksi
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 text-[#BF616A] hover:bg-[#BF616A]/20 rounded-full tap-effect"
              title="Hapus Transaksi"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#D8DEE9] hover:text-[#ECEFF4] rounded-full bg-[#3B4252] tap-effect"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 text-xs bg-[#BF616A]/15 border border-[#BF616A]/30 text-[#BF616A] rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Selector Pills */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#242933] border border-[#434C5E] rounded-2xl">
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`py-2 text-xs font-bold rounded-xl tap-effect transition-all ${
                type === "EXPENSE"
                  ? "bg-[#BF616A] text-[#ECEFF4] shadow-md shadow-[#BF616A]/20"
                  : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`py-2 text-xs font-bold rounded-xl tap-effect transition-all ${
                type === "INCOME"
                  ? "bg-[#A3BE8C] text-[#2E3440] shadow-md shadow-[#A3BE8C]/20 font-extrabold"
                  : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setType("TRANSFER")}
              className={`py-2 text-xs font-bold rounded-xl tap-effect transition-all ${
                type === "TRANSFER"
                  ? "bg-[#88C0D0] text-[#2E3440] shadow-md shadow-[#88C0D0]/20 font-extrabold"
                  : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
              }`}
            >
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
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amountStr}
                onChange={handleAmountChange}
                className="w-full text-center text-3xl sm:text-4xl font-extrabold bg-transparent text-[#ECEFF4] focus:outline-none placeholder-[#4C566A] font-mono"
              />
            </div>

            {/* Quick Add Chips */}
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

          {/* Catatan & Tanggal (Moved ABOVE Wallets for effortless writing) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#D8DEE9] flex items-center gap-1 mb-1.5">
                <StickyNote className="w-3.5 h-3.5 text-[#81A1C1]" /> Catatan (Keterangan)
              </label>
              <input
                type="text"
                placeholder="Contoh: Makan siang bareng"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none placeholder-[#4C566A]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#D8DEE9] flex items-center gap-1 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#81A1C1]" /> Tanggal Transaksi
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Wallets Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#D8DEE9] block mb-1.5">
                {type === "TRANSFER" ? "Dompet Asal" : "Dompet"}
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2.5 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none"
                required
              >
                <option value="">Pilih Dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {type === "TRANSFER" && (
              <div>
                <label className="text-xs font-semibold text-[#D8DEE9] block mb-1.5">
                  Dompet Tujuan
                </label>
                <select
                  value={destinationWalletId}
                  onChange={(e) => setDestinationWalletId(e.target.value)}
                  className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2.5 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none"
                  required
                >
                  <option value="">Pilih Dompet Tujuan</option>
                  {wallets
                    .filter((w) => w.id !== walletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Category Selector (Expense & Income) */}
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
                        <CategoryIcon name={c.icon} className="w-3.5 h-3.5" />
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

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
              className="py-3 px-4 rounded-xl bg-[#BF616A]/15 hover:bg-[#BF616A]/25 text-[#BF616A] border border-[#BF616A]/30 font-bold text-xs tap-effect flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "Menghapus..." : "Hapus"}
            </button>

            <button
              type="submit"
              disabled={isLoading || isDeleting}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] hover:from-[#4C566A] hover:to-[#81A1C1] text-[#2E3440] font-extrabold text-xs shadow-lg shadow-[#88C0D0]/25 tap-effect flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#2E3440]/30 border-t-[#2E3440] rounded-full animate-spin" />
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
