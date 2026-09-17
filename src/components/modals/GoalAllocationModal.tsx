"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowDownRight, ArrowUpRight, Wallet as WalletIcon, Calendar, AlertCircle } from "lucide-react";
import { formatCurrency, parseAmountInput, formatAmountInput } from "@/lib/utils/format";

interface GoalAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: {
    id: string;
    name: string;
    currentAmount: number;
    targetAmount: number;
    targetWalletId?: string | null;
  } | null;
  wallets: Array<{ id: string; name: string; currentBalance?: number; color: string }>;
  onSuccess: () => void;
}

export function GoalAllocationModal({
  isOpen,
  onClose,
  goal,
  wallets,
  onSuccess,
}: GoalAllocationModalProps) {
  const [type, setType] = useState<"DEPOSIT" | "WITHDRAW">("DEPOSIT");
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setType("DEPOSIT");
      setAmount("");
      setWalletId(goal.targetWalletId || wallets[0]?.id || "");
      setDate(new Date().toISOString().split("T")[0]);
      setNotes("");
    }
    setError("");
  }, [goal, wallets, isOpen]);

  if (!isOpen || !goal) return null;

  const remainingNeeded = Math.max(0, goal.targetAmount - goal.currentAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseAmountInput(amount);
    if (parsedAmount <= 0) {
      setError("Nominal harus lebih dari 0.");
      return;
    }
    if (!walletId) {
      setError("Dompet wajib dipilih.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/goals/${goal.id}/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: parsedAmount,
          walletId,
          date,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses alokasi dana.");
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
          Alokasi Dana Tabungan
        </h3>
        <p className="text-xs text-[#81A1C1] mb-4">
          Target: <strong className="text-[#ECEFF4]">{goal.name}</strong> • Saldo saat ini:{" "}
          <span className="font-mono text-[#A3BE8C]">
            {formatCurrency(goal.currentAmount)}
          </span>
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#BF616A]/15 border border-[#BF616A]/30 text-xs text-[#BF616A] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Deposit vs Withdraw Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#242933] rounded-xl border border-[#434C5E]/60">
            <button
              type="button"
              onClick={() => setType("DEPOSIT")}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === "DEPOSIT"
                  ? "bg-[#A3BE8C] text-[#2E3440] shadow-md"
                  : "text-[#D8DEE9]/60 hover:text-[#ECEFF4]"
              }`}
            >
              <ArrowDownRight className="w-4 h-4" /> Setor Tabungan
            </button>
            <button
              type="button"
              onClick={() => setType("WITHDRAW")}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === "WITHDRAW"
                  ? "bg-[#D08770] text-[#2E3440] shadow-md"
                  : "text-[#D8DEE9]/60 hover:text-[#ECEFF4]"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" /> Tarik Tabungan
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
              Nominal Alokasi (Rp)
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

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[50000, 100000, 250000, 500000, 1000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPreset(val)}
                  className="px-2.5 py-1 rounded-lg bg-[#3B4252]/60 hover:bg-[#3B4252] text-[11px] font-mono text-[#D8DEE9] transition-colors"
                >
                  +{val >= 1000000 ? `${val / 1000000}jt` : `${val / 1000}rb`}
                </button>
              ))}
              {type === "DEPOSIT" && remainingNeeded > 0 && (
                <button
                  type="button"
                  onClick={() => setPreset(remainingNeeded)}
                  className="px-2.5 py-1 rounded-lg bg-[#88C0D0]/20 hover:bg-[#88C0D0]/30 text-[11px] font-bold text-[#88C0D0] transition-colors border border-[#88C0D0]/30"
                >
                  Lunas ({formatCurrency(remainingNeeded)})
                </button>
              )}
              {type === "WITHDRAW" && goal.currentAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setPreset(goal.currentAmount)}
                  className="px-2.5 py-1 rounded-lg bg-[#D08770]/20 hover:bg-[#D08770]/30 text-[11px] font-bold text-[#D08770] transition-colors border border-[#D08770]/30"
                >
                  Tarik Semua
                </button>
              )}
            </div>
          </div>

          {/* Wallet selection */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5 flex items-center gap-1">
              <WalletIcon className="w-3.5 h-3.5 text-[#81A1C1]" />
              {type === "DEPOSIT" ? "Potong dari Dompet" : "Kirim ke Dompet"}
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
                placeholder="Setoran rutin..."
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
                type === "DEPOSIT"
                  ? "bg-[#A3BE8C] text-[#2E3440] hover:brightness-110 shadow-lg shadow-[#A3BE8C]/20"
                  : "bg-[#D08770] text-[#2E3440] hover:brightness-110 shadow-lg shadow-[#D08770]/20"
              }`}
            >
              {isSubmitting
                ? "Memproses..."
                : type === "DEPOSIT"
                ? "Setor Dana"
                : "Tarik Dana"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
