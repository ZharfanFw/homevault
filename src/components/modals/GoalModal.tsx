"use client";

import React, { useState, useEffect } from "react";
import { X, Target, Calendar, AlertCircle } from "lucide-react";
import { COLOR_PALETTE, CategoryIcon } from "@/lib/utils/icons";
import { parseAmountInput, formatAmountInput } from "@/lib/utils/format";

export interface GoalItemData {
  id?: string;
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string | null;
  color: string;
  icon: string;
  targetWalletId?: string | null;
  status?: "IN_PROGRESS" | "COMPLETED";
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingGoal?: GoalItemData | null;
  wallets: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

export function GoalModal({
  isOpen,
  onClose,
  existingGoal,
  wallets,
  onSuccess,
}: GoalModalProps) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState("#88C0D0");
  const [icon, setIcon] = useState("piggy-bank");
  const [targetWalletId, setTargetWalletId] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingGoal) {
      setName(existingGoal.name);
      setTargetAmount(formatAmountInput(existingGoal.targetAmount));
      setTargetDate(existingGoal.targetDate || "");
      setColor(existingGoal.color || "#88C0D0");
      setIcon(existingGoal.icon || "piggy-bank");
      setTargetWalletId(existingGoal.targetWalletId || "");
    } else {
      setName("");
      setTargetAmount("");
      setTargetDate("");
      setColor("#88C0D0");
      setIcon("piggy-bank");
      setTargetWalletId("");
    }
    setError("");
  }, [existingGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedTarget = parseAmountInput(targetAmount);
    if (!name.trim()) {
      setError("Nama target tabungan wajib diisi.");
      return;
    }
    if (parsedTarget <= 0) {
      setError("Target nominal harus lebih dari 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        targetAmount: parsedTarget,
        targetDate: targetDate || null,
        color,
        icon,
        targetWalletId: targetWalletId || null,
      };

      const url = existingGoal?.id ? `/api/goals/${existingGoal.id}` : "/api/goals";
      const method = existingGoal?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan target tabungan.");
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

  const quickIcons = [
    "piggy-bank",
    "laptop",
    "car",
    "home",
    "plane",
    "graduation-cap",
    "shield",
    "heart-pulse",
    "gift",
    "shopping-bag",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#2E3440] border border-[#434C5E] rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#D8DEE9]/60 hover:text-[#ECEFF4] hover:bg-[#3B4252] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#2E3440] shadow-md transition-colors"
            style={{ backgroundColor: color }}
          >
            <CategoryIcon name={icon} className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#ECEFF4] leading-tight">
              {existingGoal ? "Ubah Target Tabungan" : "Buat Target Tabungan"}
            </h3>
            <p className="text-xs text-[#81A1C1] mt-0.5">
              Rencanakan impian dan pos dana daruratmu
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#BF616A]/15 border border-[#BF616A]/30 text-xs text-[#BF616A] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
              Nama Impian / Pos Tabungan
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Dana Darurat, Beli Laptop, Liburan Jepang"
              className="w-full px-3.5 py-2.5 bg-[#242933] border border-[#434C5E] rounded-xl text-sm text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-[#88C0D0]" /> Target Nominal
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#81A1C1]">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(formatAmountInput(e.target.value))}
                placeholder="0"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#242933] border border-[#434C5E] rounded-xl text-sm font-mono text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
              />
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#88C0D0]" /> Target Tanggal Tercapai (Opsional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
            />
          </div>

          {/* Default Target Wallet */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
              Simpan di Dompet / Rekening Tertentu (Opsional)
            </label>
            <select
              value={targetWalletId}
              onChange={(e) => setTargetWalletId(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
            >
              <option value="">(Bebas / Alokasi Fleksibel)</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-2">
              Warna Tema
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PALETTE.slice(0, 10).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? "scale-115 ring-2 ring-[#ECEFF4] shadow-md" : "hover:scale-105 opacity-85"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-2">
              Ikon Target
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-1 bg-[#242933] rounded-xl border border-[#434C5E]/60">
              {quickIcons.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                    icon === ic
                      ? "bg-[#3B4252] text-[#88C0D0] ring-1 ring-[#88C0D0]/50"
                      : "text-[#D8DEE9]/60 hover:text-[#ECEFF4] hover:bg-[#3B4252]/50"
                  }`}
                >
                  <CategoryIcon name={ic} className="w-5 h-5" />
                </button>
              ))}
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
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-bold hover:brightness-110 shadow-lg shadow-[#88C0D0]/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Target"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
