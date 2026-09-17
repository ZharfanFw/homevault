"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Repeat, Wallet as WalletIcon, Tag, AlertCircle } from "lucide-react";
import { parseAmountInput, formatAmountInput } from "@/lib/utils/format";

export interface RecurringItemData {
  id?: string;
  name: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  walletId: string;
  categoryId?: string | null;
  startDate: string;
  nextDueDate: string;
  status: "ACTIVE" | "PAUSED";
  autoCreate: boolean;
  notes?: string | null;
}

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingItem?: RecurringItemData | null;
  wallets: Array<{ id: string; name: string; color: string }>;
  categories: Array<{ id: string; name: string; type: string }>;
  onSuccess: () => void;
}

export function RecurringModal({
  isOpen,
  onClose,
  existingItem,
  wallets,
  categories,
  onSuccess,
}: RecurringModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("MONTHLY");
  const [walletId, setWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED">("ACTIVE");
  const [autoCreate, setAutoCreate] = useState(false);
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingItem) {
      setName(existingItem.name);
      setType(existingItem.type);
      setAmount(formatAmountInput(existingItem.amount));
      setFrequency(existingItem.frequency);
      setWalletId(existingItem.walletId);
      setCategoryId(existingItem.categoryId || "");
      setStartDate(existingItem.startDate);
      setNextDueDate(existingItem.nextDueDate);
      setStatus(existingItem.status);
      setAutoCreate(existingItem.autoCreate);
      setNotes(existingItem.notes || "");
    } else {
      const today = new Date().toISOString().split("T")[0];
      setName("");
      setType("EXPENSE");
      setAmount("");
      setFrequency("MONTHLY");
      setWalletId(wallets[0]?.id || "");
      setCategoryId("");
      setStartDate(today);
      setNextDueDate(today);
      setStatus("ACTIVE");
      setAutoCreate(false);
      setNotes("");
    }
    setError("");
  }, [existingItem, wallets, isOpen]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseAmountInput(amount);
    if (!name.trim()) {
      setError("Nama tagihan / langganan wajib diisi.");
      return;
    }
    if (parsedAmount <= 0) {
      setError("Nominal harus lebih dari 0.");
      return;
    }
    if (!walletId) {
      setError("Dompet wajib dipilih.");
      return;
    }
    if (!startDate) {
      setError("Tanggal mulai wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        type,
        amount: parsedAmount,
        frequency,
        walletId,
        categoryId: categoryId || null,
        startDate,
        nextDueDate: nextDueDate || startDate,
        status,
        autoCreate,
        notes: notes.trim() || null,
      };

      const url = existingItem?.id
        ? `/api/recurring/${existingItem.id}`
        : "/api/recurring";
      const method = existingItem?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan transaksi berulang.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan sistem.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#2E3440] border border-[#434C5E] rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#D8DEE9]/60 hover:text-[#ECEFF4] hover:bg-[#3B4252] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-[#ECEFF4] mb-4">
          {existingItem ? "Ubah Transaksi Berulang" : "Tambah Transaksi Berulang"}
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#BF616A]/15 border border-[#BF616A]/30 text-xs text-[#BF616A] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#242933] rounded-xl border border-[#434C5E]/60">
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                type === "EXPENSE"
                  ? "bg-[#BF616A] text-[#ECEFF4] shadow-md"
                  : "text-[#D8DEE9]/60 hover:text-[#ECEFF4]"
              }`}
            >
              Tagihan / Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                type === "INCOME"
                  ? "bg-[#A3BE8C] text-[#2E3440] shadow-md"
                  : "text-[#D8DEE9]/60 hover:text-[#ECEFF4]"
              }`}
            >
              Pemasukan Rutin
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
              Nama Langganan / Tagihan
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Netflix, WiFi Rumah, Gaji Bulanan"
              className="w-full px-3.5 py-2.5 bg-[#242933] border border-[#434C5E] rounded-xl text-sm text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#81A1C1]">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                placeholder="0"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#242933] border border-[#434C5E] rounded-xl text-sm font-mono text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
              />
            </div>
          </div>

          {/* Frequency & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5 flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-[#88C0D0]" /> Frekuensi
              </label>
              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(
                    e.target.value as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
                  )
                }
                className="w-full px-3 py-2.5 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
              >
                <option value="DAILY">Harian</option>
                <option value="WEEKLY">Mingguan</option>
                <option value="MONTHLY">Bulanan</option>
                <option value="YEARLY">Tahunan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#88C0D0]" /> Jatuh Tempo
              </label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
              />
            </div>
          </div>

          {/* Wallet & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5 flex items-center gap-1">
                <WalletIcon className="w-3.5 h-3.5 text-[#81A1C1]" /> Dompet
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#81A1C1]" /> Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
              >
                <option value="">(Tanpa Kategori)</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Auto-create */}
          <div className="flex items-center justify-between p-3 bg-[#242933] rounded-xl border border-[#434C5E]/60 text-xs">
            <div>
              <span className="font-semibold text-[#ECEFF4] block">
                Status Aturan
              </span>
              <span className="text-[11px] text-[#81A1C1]">
                {status === "ACTIVE" ? "Aktif & dipantau" : "Dijeda sementara"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStatus(status === "ACTIVE" ? "PAUSED" : "ACTIVE")}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                status === "ACTIVE"
                  ? "bg-[#A3BE8C]/20 text-[#A3BE8C] border border-[#A3BE8C]/30"
                  : "bg-[#434C5E] text-[#D8DEE9]"
              }`}
            >
              {status === "ACTIVE" ? "Aktif" : "Jeda"}
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: No. Pelanggan 12345"
              className="w-full px-3.5 py-2.5 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#434C5E] text-xs font-bold text-[#D8DEE9] hover:bg-[#3B4252] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-bold hover:brightness-110 shadow-lg shadow-[#88C0D0]/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
