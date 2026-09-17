"use client";

import React, { useState, useEffect } from "react";
import { X, Wallet as WalletIcon, Calendar, AlertCircle } from "lucide-react";
import { formatCurrency, parseAmountInput, formatAmountInput } from "@/lib/utils/format";

interface DebtRepayModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: {
    id: string;
    type: "PAYABLE" | "RECEIVABLE";
    personName: string;
    totalAmount: number;
    remainingAmount: number;
  } | null;
  wallets: Array<{ id: string; name: string; currentBalance?: number }>;
  onSuccess: () => void;
}

export function DebtRepayModal({
  isOpen,
  onClose,
  debt,
  wallets,
  onSuccess,
}: DebtRepayModalProps) {
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (debt) {
      setAmount(formatAmountInput(debt.remainingAmount));
      setWalletId(wallets[0]?.id || "");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setNotes("");
    }
    setError("");
  }, [debt, wallets, isOpen]);

  if (!isOpen || !debt) return null;

  const isPayable = debt.type === "PAYABLE";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseAmountInput(amount);
    if (parsedAmount <= 0) {
      setError("Nominal pembayaran harus lebih dari 0.");
      return;
    }
    if (parsedAmount > debt.remainingAmount) {
      setError(
        `Nominal melebihi sisa tagihan (${formatCurrency(debt.remainingAmount)}).`
      );
      return;
    }
    if (!walletId) {
      setError("Dompet wajib dipilih.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/debts/${debt.id}/repay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          walletId,
          paymentDate,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses pembayaran cicilan.");
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

  const setPreset = (val: number) => {
    setAmount(formatAmountInput(val));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#2E3440] border border-[#434C5E] rounded-3xl p-5 sm:p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#D8DEE9]/60 hover:text-[#ECEFF4] hover:bg-[#3B4252] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-[#ECEFF4] mb-1">
          {isPayable ? "Bayar Cicilan Utang" : "Catat Penerimaan Piutang"}
        </h3>
        <p className="text-xs text-[#81A1C1] mb-4">
          Pihak: <strong className="text-[#ECEFF4]">{debt.personName}</strong> • Sisa:{" "}
          <span className="font-mono font-bold text-[#BF616A]">
            {formatCurrency(debt.remainingAmount)}
          </span>
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#BF616A]/15 border border-[#BF616A]/30 text-xs text-[#BF616A] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
              Nominal Pembayaran (Rp)
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

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setPreset(debt.remainingAmount)}
                className="px-2.5 py-1 rounded-lg bg-[#A3BE8C]/20 hover:bg-[#A3BE8C]/30 text-[11px] font-bold text-[#A3BE8C] transition-colors border border-[#A3BE8C]/30"
              >
                Pelunasan Penuh ({formatCurrency(debt.remainingAmount)})
              </button>
              {debt.remainingAmount > 100000 && (
                <button
                  type="button"
                  onClick={() => setPreset(Math.floor(debt.remainingAmount / 2))}
                  className="px-2.5 py-1 rounded-lg bg-[#3B4252]/60 hover:bg-[#3B4252] text-[11px] font-mono text-[#D8DEE9] transition-colors"
                >
                  Bayar 50%
                </button>
              )}
            </div>
          </div>

          {/* Wallet */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5 flex items-center gap-1">
              <WalletIcon className="w-3.5 h-3.5 text-[#81A1C1]" />
              {isPayable ? "Potong dari Dompet" : "Masuk ke Dompet"}
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.currentBalance !== undefined
                    ? ` (Saldo: ${formatCurrency(w.currentBalance)})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#81A1C1]" /> Tanggal
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Cicilan ke-1..."
                className="w-full px-3 py-2 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
              />
            </div>
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
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                isPayable
                  ? "bg-[#BF616A] text-[#ECEFF4] hover:brightness-110 shadow-lg shadow-[#BF616A]/20"
                  : "bg-[#88C0D0] text-[#2E3440] hover:brightness-110 shadow-lg shadow-[#88C0D0]/20"
              }`}
            >
              {isSubmitting ? "Memproses..." : "Konfirmasi Pembayaran"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
