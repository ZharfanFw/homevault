"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowLeftRight, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/lib/utils/icons";
import { formatCurrency } from "@/lib/utils/format";

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
  const [amount, setAmount] = useState<number>(0);
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
      setAmount(transaction.amount);
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
    setAmount((prev) => prev + add);
  };

  const handleMultiply = (mult: number) => {
    setAmount((prev) => prev * mult);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
        className="w-full max-w-lg bg-[#2E3440] border-t sm:border border-[#434C5E] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
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
          <div>
            <label className="text-[11px] font-semibold text-[#81A1C1] block mb-1">
              Nominal
            </label>
            <div className="flex items-center gap-2 bg-[#242933] border border-[#434C5E] rounded-2xl px-4 py-3 focus-within:border-[#88C0D0] transition-colors">
              <span className="text-base font-bold text-[#81A1C1] font-mono">Rp</span>
              <input
                type="number"
                placeholder="0"
                value={amount === 0 ? "" : amount}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-transparent text-xl sm:text-2xl font-extrabold text-[#ECEFF4] font-mono focus:outline-none placeholder-[#4C566A]"
                required
              />
            </div>

            {/* Quick Add Chips */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => handleAddAmount(10000)}
                className="shrink-0 px-2.5 py-1 text-[11px] font-mono font-bold bg-[#3B4252] hover:bg-[#434C5E] text-[#ECEFF4] rounded-lg border border-[#434C5E] tap-effect"
              >
                +10rb
              </button>
              <button
                type="button"
                onClick={() => handleAddAmount(50000)}
                className="shrink-0 px-2.5 py-1 text-[11px] font-mono font-bold bg-[#3B4252] hover:bg-[#434C5E] text-[#ECEFF4] rounded-lg border border-[#434C5E] tap-effect"
              >
                +50rb
              </button>
              <button
                type="button"
                onClick={() => handleAddAmount(100000)}
                className="shrink-0 px-2.5 py-1 text-[11px] font-mono font-bold bg-[#3B4252] hover:bg-[#434C5E] text-[#ECEFF4] rounded-lg border border-[#434C5E] tap-effect"
              >
                +100rb
              </button>
              <button
                type="button"
                onClick={() => handleMultiply(1000)}
                className="shrink-0 px-2.5 py-1 text-[11px] font-mono font-bold bg-[#3B4252] hover:bg-[#434C5E] text-[#88C0D0] rounded-lg border border-[#434C5E] tap-effect"
              >
                000
              </button>
              <button
                type="button"
                onClick={() => setAmount(0)}
                className="shrink-0 px-2.5 py-1 text-[11px] font-bold bg-[#BF616A]/20 hover:bg-[#BF616A]/30 text-[#BF616A] rounded-lg border border-[#BF616A]/30 tap-effect ml-auto"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Wallets Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#81A1C1] block mb-1">
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
                <label className="text-[11px] font-semibold text-[#81A1C1] block mb-1">
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
              <label className="text-[11px] font-semibold text-[#81A1C1] block mb-1.5">
                Kategori
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 bg-[#242933] border border-[#434C5E] rounded-2xl no-scrollbar">
                {filteredCategories.map((c) => {
                  const isSelected = categoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all tap-effect ${
                        isSelected
                          ? "bg-[#3B4252] border-[#88C0D0] shadow-sm"
                          : "bg-[#2E3440]/50 border-transparent hover:border-[#434C5E]"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2E3440] shrink-0"
                        style={{ backgroundColor: c.color }}
                      >
                        <CategoryIcon name={c.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-medium text-[#ECEFF4] truncate max-w-full">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#81A1C1] block mb-1">
                Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#81A1C1] block mb-1">
                Catatan (Opsional)
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
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] hover:brightness-110 text-[#2E3440] font-extrabold text-xs shadow-lg shadow-[#88C0D0]/25 tap-effect flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
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
