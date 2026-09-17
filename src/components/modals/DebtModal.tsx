"use client";

import React, { useState, useEffect } from "react";
import { X, User, Calendar, AlertCircle, CheckSquare, Square } from "lucide-react";
import { parseAmountInput, formatAmountInput } from "@/lib/utils/format";

export interface DebtItemData {
  id?: string;
  type: "PAYABLE" | "RECEIVABLE";
  personName: string;
  totalAmount: number;
  remainingAmount?: number;
  startDate: string;
  dueDate?: string | null;
  notes?: string | null;
  status?: "UNPAID" | "PARTIALLY_PAID" | "SETTLED";
}

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingDebt?: DebtItemData | null;
  wallets: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

export function DebtModal({
  isOpen,
  onClose,
  existingDebt,
  wallets,
  onSuccess,
}: DebtModalProps) {
  const [type, setType] = useState<"PAYABLE" | "RECEIVABLE">("PAYABLE");
  const [personName, setPersonName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [syncWallet, setSyncWallet] = useState(false);
  const [syncWalletId, setSyncWalletId] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingDebt) {
      setType(existingDebt.type);
      setPersonName(existingDebt.personName);
      setTotalAmount(formatAmountInput(existingDebt.totalAmount));
      setStartDate(existingDebt.startDate);
      setDueDate(existingDebt.dueDate || "");
      setNotes(existingDebt.notes || "");
      setSyncWallet(false);
      setSyncWalletId("");
    } else {
      const today = new Date().toISOString().split("T")[0];
      setType("PAYABLE");
      setPersonName("");
      setTotalAmount("");
      setStartDate(today);
      setDueDate("");
      setNotes("");
      setSyncWallet(false);
      setSyncWalletId(wallets[0]?.id || "");
    }
    setError("");
  }, [existingDebt, wallets, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseAmountInput(totalAmount);
    if (!personName.trim()) {
      setError("Nama orang / pihak terkait wajib diisi.");
      return;
    }
    if (parsedAmount <= 0) {
      setError("Nominal harus lebih dari 0.");
      return;
    }
    if (!startDate) {
      setError("Tanggal mulai pinjaman wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Record<string, unknown> = {
        type,
        personName: personName.trim(),
        totalAmount: parsedAmount,
        startDate,
        dueDate: dueDate || null,
        notes: notes.trim() || null,
      };

      if (!existingDebt && syncWallet && syncWalletId) {
        payload.syncWalletId = syncWalletId;
      }

      const url = existingDebt?.id ? `/api/debts/${existingDebt.id}` : "/api/debts";
      const method = existingDebt?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan data utang piutang.");
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

        <h3 className="text-lg font-bold text-[#ECEFF4] mb-1">
          {existingDebt ? "Ubah Data Utang / Piutang" : "Catat Utang / Piutang"}
        </h3>
        <p className="text-xs text-[#81A1C1] mb-4">
          Kelola pinjaman dan penagihan dengan rapi
        </p>

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
              disabled={!!existingDebt}
              onClick={() => setType("PAYABLE")}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                type === "PAYABLE"
                  ? "bg-[#BF616A] text-[#ECEFF4] shadow-md"
                  : "text-[#D8DEE9]/60 hover:text-[#ECEFF4]"
              } ${existingDebt ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              Utang Saya (Kita Berutang)
            </button>
            <button
              type="button"
              disabled={!!existingDebt}
              onClick={() => setType("RECEIVABLE")}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                type === "RECEIVABLE"
                  ? "bg-[#88C0D0] text-[#2E3440] shadow-md"
                  : "text-[#D8DEE9]/60 hover:text-[#ECEFF4]"
              } ${existingDebt ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              Piutang Saya (Orang Meminjam)
            </button>
          </div>

          {/* Person Name */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#88C0D0]" />
              {type === "PAYABLE" ? "Nama Pemberi Pinjaman" : "Nama Peminjam"}
            </label>
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Contoh: Budi, Kakak, Bank Mandiri"
              className="w-full px-3.5 py-2.5 bg-[#242933] border border-[#434C5E] rounded-xl text-sm text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
            />
          </div>

          {/* Total Amount */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
              Total Nominal Pinjaman (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#81A1C1]">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                disabled={!!existingDebt}
                value={totalAmount}
                onChange={(e) => setTotalAmount(formatAmountInput(e.target.value))}
                placeholder="0"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-[#242933] border border-[#434C5E] rounded-xl text-sm font-mono text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0] ${
                  existingDebt ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#81A1C1]" /> Tanggal Mulai
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#88C0D0]" /> Jatuh Tempo
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
              />
            </div>
          </div>

          {/* Sync with Wallet Option (Only on create) */}
          {!existingDebt && (
            <div className="p-3 bg-[#242933] rounded-xl border border-[#434C5E]/60 space-y-2.5">
              <button
                type="button"
                onClick={() => setSyncWallet(!syncWallet)}
                className="flex items-center gap-2 text-xs font-semibold text-[#ECEFF4] hover:text-[#88C0D0] transition-colors cursor-pointer w-full text-left"
              >
                {syncWallet ? (
                  <CheckSquare className="w-4 h-4 text-[#88C0D0]" />
                ) : (
                  <Square className="w-4 h-4 text-[#81A1C1]" />
                )}
                <span>
                  {type === "PAYABLE"
                    ? "Sinkronkan uang masuk ke dompet sekarang"
                    : "Potong uang dari dompet sekarang"}
                </span>
              </button>

              {syncWallet && (
                <div className="pt-1 animate-fade-in">
                  <label className="block text-[11px] font-semibold text-[#81A1C1] mb-1">
                    Pilih Dompet:
                  </label>
                  <select
                    value={syncWalletId}
                    onChange={(e) => setSyncWalletId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2E3440] border border-[#434C5E] rounded-lg text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Untuk bayar servis motor"
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
              {isSubmitting ? "Menyimpan..." : "Simpan Catatan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
