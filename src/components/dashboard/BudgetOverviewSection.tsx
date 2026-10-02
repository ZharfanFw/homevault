"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, getMonthName } from "@/lib/utils/format";
import { CategoryIcon } from "@/lib/utils/icons";
import { BudgetModal } from "@/components/modals/BudgetModal";
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amountLimit: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export function BudgetOverviewSection() {
  const {
    selectedMonth,
    selectedYear,
    refreshTrigger,
    triggerRefresh,
  } = useApp();

  const [categories, setCategories] = useState<
    Array<{
      id: string;
      name: string;
      type: string;
      icon: string;
      color: string;
    }>
  >([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetItem | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [catsRes, budgetsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`),
      ]);

      if (catsRes.ok) {
        const cData = await catsRes.json();
        setCategories(cData.categories || []);
      }
      if (budgetsRes.ok) {
        const bData = await budgetsRes.json();
        setBudgets(bData.budgets || []);
      }
    } catch (e) {
      console.error("Fetch dashboard budgets error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const handleDeleteBudget = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus anggaran untuk "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        triggerRefresh();
      }
    } catch (e) {
      console.error("Delete budget error:", e);
    }
  };

  // Aggregated calculations
  const totalLimit = budgets.reduce((acc, b) => acc + b.amountLimit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const overallPercentage =
    totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
  const remainingBudget = totalLimit - totalSpent;
  const overbudgetCount = budgets.filter((b) => b.percentage > 100).length;

  const getStatusColor = (percentage: number) => {
    if (percentage > 100) return "text-[#BF616A]";
    if (percentage >= 80) return "text-[#EBCB8B]";
    return "text-[#A3BE8C]";
  };

  const getBarColor = (percentage: number) => {
    if (percentage > 100) return "bg-[#BF616A]";
    if (percentage >= 80) return "bg-[#EBCB8B]";
    return "bg-[#A3BE8C]";
  };

  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-[#2E3440] border border-[#434C5E] animate-pulse">
        <div className="h-5 w-44 bg-[#3B4252] rounded-lg mb-3" />
        <div className="h-10 w-full bg-[#3B4252] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#2E3440] border border-[#434C5E] p-4 sm:p-5 shadow-sm hover:border-[#88C0D0]/40 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#88C0D0]/15 text-[#88C0D0] flex items-center justify-center font-bold">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#81A1C1]">
                Target Anggaran
              </h3>
              <span className="text-[10px] font-semibold text-[#D8DEE9]/60">
                {getMonthName(selectedMonth - 1)} {selectedYear}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#ECEFF4] mt-0.5">
              Batas Pengeluaran Bulanan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedBudget(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] hover:brightness-110 active:scale-95 text-[#2E3440] text-xs font-bold shadow-sm transition-all tap-effect cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
            <span>Set Anggaran</span>
          </button>

          {budgets.length > 0 && (
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1.5 rounded-xl bg-[#242933] border border-[#434C5E] text-[#81A1C1] hover:text-[#ECEFF4] transition-colors"
              title={isExpanded ? "Sembunyikan rincian" : "Tampilkan rincian"}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Main Budget Content */}
      {budgets.length === 0 ? (
        <div className="mt-4 p-5 rounded-2xl bg-[#242933]/60 border border-[#434C5E]/60 text-center space-y-2">
          <p className="text-xs font-bold text-[#ECEFF4]">
            Belum ada target anggaran untuk bulan ini
          </p>
          <p className="text-[11px] text-[#81A1C1] max-w-sm mx-auto leading-relaxed">
            Tentukan batas pengeluaran kategori favorit Anda (seperti Makanan, Hiburan, Belanja) agar pengeluaran tetap terkendali.
          </p>
          <button
            onClick={() => {
              setSelectedBudget(null);
              setIsModalOpen(true);
            }}
            className="mt-1 inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-[#3B4252] hover:bg-[#434C5E] text-[#88C0D0] text-xs font-bold transition-colors tap-effect"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mulai Pasang Anggaran Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3.5">
          {/* Overall Monthly Health Banner */}
          <div className="p-3.5 rounded-xl bg-[#242933] border border-[#434C5E]/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#81A1C1] font-medium">
                Total Terpakai:{" "}
                <b className="text-[#ECEFF4] font-mono">
                  {formatCurrency(totalSpent)}
                </b>{" "}
                / {formatCurrency(totalLimit)}
              </span>
              <span
                className={`font-black font-mono text-xs ${getStatusColor(
                  overallPercentage
                )}`}
              >
                {overallPercentage}%
              </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-[#2E3440] rounded-full h-2 overflow-hidden border border-[#434C5E]/30">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(
                  overallPercentage
                )}`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-[#81A1C1]">
                {remainingBudget >= 0 ? (
                  <span className="flex items-center gap-1 text-[#A3BE8C]">
                    <CheckCircle2 className="w-3 h-3" /> Sisa Anggaran:{" "}
                    <b>{formatCurrency(remainingBudget)}</b>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[#BF616A] font-semibold">
                    <AlertCircle className="w-3 h-3" /> Melebihi Anggaran:{" "}
                    <b>{formatCurrency(Math.abs(remainingBudget))}</b>
                  </span>
                )}
              </span>

              {overbudgetCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#BF616A]/15 text-[#BF616A] border border-[#BF616A]/30">
                  {overbudgetCount} Kategori Overspend
                </span>
              )}
            </div>
          </div>

          {/* Category Budgets Grid / List (Expandable) */}
          {isExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fade-in pt-0.5">
              {budgets.map((b) => {
                const statusColor = getStatusColor(b.percentage);
                const barColor = getBarColor(b.percentage);

                return (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-[#242933]/80 border border-[#434C5E]/60 space-y-2 hover:border-[#88C0D0]/40 transition-all shadow-sm group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2E3440] shrink-0 font-bold"
                          style={{ backgroundColor: b.categoryColor || "#88C0D0" }}
                        >
                          <CategoryIcon name={b.categoryIcon} className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-[#ECEFF4] truncate">
                          {b.categoryName}
                        </h4>
                      </div>

                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedBudget(b);
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-[#81A1C1] hover:text-[#ECEFF4] hover:bg-[#3B4252] rounded-md transition-colors"
                          title="Ubah Anggaran"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteBudget(b.id, b.categoryName)
                          }
                          className="p-1 text-[#81A1C1] hover:text-[#BF616A] hover:bg-[#3B4252] rounded-md transition-colors"
                          title="Hapus Anggaran"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#81A1C1] font-mono">
                        {formatCurrency(b.spent)} /{" "}
                        <span className="text-[#D8DEE9]">
                          {formatCurrency(b.amountLimit)}
                        </span>
                      </span>
                      <span className={`font-black font-mono ${statusColor}`}>
                        {b.percentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#2E3440] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Integrated Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBudget(null);
        }}
        month={selectedMonth}
        year={selectedYear}
        categories={categories}
        existingBudget={selectedBudget}
        onSuccess={() => {
          fetchData();
          triggerRefresh();
        }}
      />
    </div>
  );
}
