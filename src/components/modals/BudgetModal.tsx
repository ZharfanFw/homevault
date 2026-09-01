"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CategoryIcon } from "@/lib/utils/icons";
import { parseAmountInput, formatAmountInput } from "@/lib/utils/format";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: number;
  year: number;
  categories: Array<{
    id: string;
    name: string;
    type: string;
    icon: string;
    color: string;
  }>;
  existingBudget?: {
    id: string;
    categoryId: string;
    amountLimit: number;
  } | null;
  onSuccess: () => void;
}

export function BudgetModal({
  isOpen,
  onClose,
  month,
  year,
  categories,
  existingBudget,
  onSuccess,
}: BudgetModalProps) {
  const [categoryId, setCategoryId] = useState("");
  const [amountLimit, setAmountLimit] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  useEffect(() => {
    if (existingBudget) {
      setCategoryId(existingBudget.categoryId);
      setAmountLimit(formatAmountInput(existingBudget.amountLimit));
    } else {
      if (expenseCategories.length > 0) {
        setCategoryId(expenseCategories[0].id);
      }
      setAmountLimit("");
    }
    setError("");
  }, [existingBudget, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedLimit = parseAmountInput(amountLimit);
    if (!parsedLimit || parsedLimit <= 0) {
      setError("Masukkan batas anggaran yang valid.");
      return;
    }

    if (!categoryId) {
      setError("Pilih kategori anggaran.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          amountLimit: parsedLimit,
          month,
          year,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan anggaran.");
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#242933]/80 backdrop-blur-md">
      <div
        className="w-full max-w-md bg-[#2E3440] border-t sm:border border-[#434C5E] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#434C5E]">
          <h3 className="text-base font-bold text-[#ECEFF4]">
            {existingBudget ? "Ubah Target Anggaran" : "Pasang Target Anggaran"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#D8DEE9] hover:text-[#ECEFF4] rounded-full bg-[#3B4252] tap-effect"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 text-xs bg-[#BF616A]/15 border border-[#BF616A]/30 text-[#BF616A] rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#D8DEE9] block mb-1">
              Kategori Pengeluaran
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none"
              disabled={Boolean(existingBudget)}
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#D8DEE9] block mb-1">
              Batas Anggaran Bulanan (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 1.500.000"
              value={amountLimit}
              onChange={(e) => {
                const raw = e.target.value;
                const parsed = parseAmountInput(raw);
                setAmountLimit(raw ? formatAmountInput(parsed) : "");
              }}
              className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] hover:brightness-110 text-[#2E3440] font-extrabold text-xs shadow-lg shadow-[#88C0D0]/25 tap-effect flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-[#2E3440]/30 border-t-[#2E3440] rounded-full animate-spin" />
            ) : (
              "Simpan Anggaran"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
