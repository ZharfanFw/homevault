"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CategoryIcon } from "@/lib/utils/icons";

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
      setAmountLimit(existingBudget.amountLimit.toString());
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

    const parsedLimit = parseInt(amountLimit, 10);
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">
            {existingBudget ? "Ubah Target Anggaran" : "Pasang Target Anggaran"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 tap-effect"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Kategori Pengeluaran
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Batas Anggaran Bulanan (Rp)
            </label>
            <input
              type="number"
              placeholder="Contoh: 1500000"
              value={amountLimit}
              onChange={(e) => setAmountLimit(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 tap-effect flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Simpan Anggaran"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
