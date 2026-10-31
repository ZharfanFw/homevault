"use client";

import React, { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, CheckCircle2, RotateCcw } from "lucide-react";
import { CategoryIcon } from "@/lib/utils/icons";
import {
  parseAmountInput,
  formatAmountInput,
  formatCurrency,
  getLocalDateString,
} from "@/lib/utils/format";

export interface AdjustBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: {
    id: string;
    name: string;
    type: string;
    color: string;
    icon: string;
    currentBalance: number;
  } | null;
  onSuccess: () => void;
}

export function AdjustBalanceModal({
  isOpen,
  onClose,
  wallet,
  onSuccess,
}: AdjustBalanceModalProps) {
  const [targetBalanceStr, setTargetBalanceStr] = useState("");
  const [date, setDate] = useState(getLocalDateString());
  const [notes, setNotes] = useState("Penyesuaian saldo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (wallet && isOpen) {
      setTargetBalanceStr(
        wallet.currentBalance === 0 ? "0" : formatAmountInput(wallet.currentBalance)
      );
      setDate(getLocalDateString());
      setNotes(`Penyesuaian saldo ${wallet.name}`);
      setError("");
    }
  }, [wallet, isOpen]);

  if (!isOpen || !wallet) return null;

  const currentBalance = wallet.currentBalance || 0;
  const parsedTarget = parseAmountInput(targetBalanceStr);
  const diff = parsedTarget - currentBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (targetBalanceStr.trim() === "") {
      setError("Masukkan target saldo riil dompet.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/wallets/${wallet.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetBalance: parsedTarget,
          date,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyesuaikan saldo dompet.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat memproses penyesuaian saldo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#242933]/80 backdrop-blur-md p-0 sm:p-4">
      <div
        className="w-full sm:max-w-md bg-[#2E3440] border-t sm:border border-[#434C5E] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#434C5E]/60">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#2E3440] shadow-md shrink-0"
              style={{ backgroundColor: wallet.color }}
            >
              <CategoryIcon name={wallet.icon} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#ECEFF4] tracking-tight">
                Sesuaikan Saldo
              </h3>
              <p className="text-xs text-[#D8DEE9]/70 font-medium">
                {wallet.name} &bull; Saldo Aplikasi:{" "}
                <span className="font-mono text-[#88C0D0]">
                  {formatCurrency(currentBalance)}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#D8DEE9]/60 hover:text-[#ECEFF4] hover:bg-[#3B4252] tap-effect"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#BF616A]/15 border border-[#BF616A]/30 text-[#BF616A] text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Target Balance Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#D8DEE9]">
                Target Saldo Riil Saat Ini (Rp)
              </label>
              <span className="text-[10px] text-[#4C566A]">Sesuai Rekening Fisik</span>
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={targetBalanceStr}
                onChange={(e) => {
                  const raw = e.target.value;
                  const parsed = parseAmountInput(raw);
                  setTargetBalanceStr(raw ? formatAmountInput(parsed) : "");
                }}
                placeholder="0"
                autoFocus
                className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3.5 py-2.5 text-base text-[#ECEFF4] focus:border-[#88C0D0] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none font-mono font-bold transition-all"
              />
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setTargetBalanceStr("0")}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#3B4252] hover:bg-[#434C5E] text-[#D8DEE9] border border-[#434C5E] tap-effect flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3 text-[#EBCB8B]" />
                Set ke Rp 0
              </button>
              <button
                type="button"
                onClick={() =>
                  setTargetBalanceStr(
                    currentBalance === 0 ? "0" : formatAmountInput(currentBalance)
                  )
                }
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#3B4252] hover:bg-[#434C5E] text-[#D8DEE9] border border-[#434C5E] tap-effect"
              >
                Sesuai Aplikasi
              </button>
            </div>
          </div>

          {/* Difference / Adjustment Preview Box */}
          <div
            className={`rounded-xl p-3 border transition-all text-xs ${
              diff > 0
                ? "bg-[#A3BE8C]/15 border-[#A3BE8C]/30"
                : diff < 0
                ? "bg-[#BF616A]/15 border-[#BF616A]/30"
                : "bg-[#4C566A]/20 border-[#434C5E]"
            }`}
          >
            {diff > 0 ? (
              <div className="flex items-start gap-2.5 text-[#A3BE8C]">
                <TrendingUp className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-[13px]">
                    + {formatCurrency(Math.abs(diff))} (Pemasukan Koreksi Saldo)
                  </div>
                  <p className="text-[#D8DEE9]/80 text-[11px] mt-0.5 leading-relaxed">
                    Saldo fisik lebih besar dari aplikasi. Sistem akan membuat transaksi pemasukan penyesuaian agar saldo menjadi cocok.
                  </p>
                </div>
              </div>
            ) : diff < 0 ? (
              <div className="flex items-start gap-2.5 text-[#BF616A]">
                <TrendingDown className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-[13px]">
                    - {formatCurrency(Math.abs(diff))} (Pengeluaran Koreksi Saldo)
                  </div>
                  <p className="text-[#D8DEE9]/80 text-[11px] mt-0.5 leading-relaxed">
                    Saldo fisik lebih kecil dari aplikasi. Sistem akan membuat transaksi pengeluaran penyesuaian agar saldo menjadi cocok.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 text-[#88C0D0]">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-[13px]">
                    Saldo sudah sesuai ({formatCurrency(currentBalance)})
                  </div>
                  <p className="text-[#D8DEE9]/70 text-[11px] mt-0.5 leading-relaxed">
                    Target saldo sama dengan saldo berjalan di aplikasi saat ini. Tidak ada transaksi koreksi yang diperlukan.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-[#D8DEE9] block mb-1">
                Tanggal Koreksi
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2 text-xs text-[#ECEFF4] focus:border-[#88C0D0] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#D8DEE9] block mb-1">
                Keterangan
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Penyesuaian saldo"
                className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2 text-xs text-[#ECEFF4] focus:border-[#88C0D0] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] hover:brightness-110 text-[#2E3440] font-extrabold text-xs shadow-lg shadow-[#88C0D0]/25 tap-effect flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-[#2E3440]/30 border-t-[#2E3440] rounded-full animate-spin" />
              ) : (
                "Simpan Penyesuaian"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
