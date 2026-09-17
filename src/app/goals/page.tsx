"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { CategoryIcon } from "@/lib/utils/icons";
import { GoalModal } from "@/components/modals/GoalModal";
import { GoalAllocationModal } from "@/components/modals/GoalAllocationModal";
import {
  Plus,
  Target,
  PiggyBank,
  CheckCircle,
  Calendar,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  TrendingUp,
} from "lucide-react";

interface EnrichedGoalItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null;
  color: string;
  icon: string;
  targetWalletId?: string | null;
  status?: "IN_PROGRESS" | "COMPLETED";
  targetWalletName?: string | null;
  targetWalletColor?: string | null;
  percentage: number;
  remainingAmount: number;
  daysRemaining: number | null;
  recommendedMonthly: number;
  logs: Array<{
    id: string;
    type: "DEPOSIT" | "WITHDRAW";
    amount: number;
    date: string;
    notes?: string | null;
    walletName?: string | null;
  }>;
}

export default function GoalsPage() {
  const { refreshTrigger, triggerRefresh } = useApp();
  const [goals, setGoals] = useState<EnrichedGoalItem[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);
  const [wallets, setWallets] = useState<Array<{ id: string; name: string; currentBalance?: number; color: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalForEdit, setSelectedGoalForEdit] = useState<EnrichedGoalItem | null>(null);

  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [selectedGoalForAlloc, setSelectedGoalForAlloc] = useState<EnrichedGoalItem | null>(null);

  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [goalsRes, walletsRes] = await Promise.all([
        fetch("/api/goals"),
        fetch("/api/wallets"),
      ]);

      if (goalsRes.ok) {
        const gData = await goalsRes.json();
        setGoals(gData.goals || []);
        setTotalSaved(gData.totalSaved || 0);
        setTotalTarget(gData.totalTarget || 0);
      }
      if (walletsRes.ok) {
        const wData = await walletsRes.json();
        setWallets(wData.wallets || []);
      }
    } catch (e) {
      console.error("Fetch goals page error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus target tabungan "${name}"? Seluruh riwayat log alokasi juga akan dihapus.`)) return;
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerRefresh();
      }
    } catch (e) {
      console.error("Delete goal error:", e);
    }
  };

  const overallPercent =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#ECEFF4] tracking-tight">
            Target Tabungan
          </h2>
          <p className="text-xs text-[#81A1C1] mt-0.5 font-medium">
            Sinking funds, dana darurat, & impian masa depan
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedGoalForEdit(null);
            setIsGoalModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-bold shadow-md shadow-[#88C0D0]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.8]" /> Buat Target
        </button>
      </div>

      {/* Aggregate Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#2E3440] to-[#3B4252] border border-[#434C5E] shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#88C0D0] flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4" /> Total Terkumpul di Semua Goal
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#ECEFF4] mt-1.5">
              {formatCurrency(totalSaved)}
            </p>
            <p className="text-xs text-[#D8DEE9]/70 mt-1 font-mono">
              dari target {formatCurrency(totalTarget)} ({overallPercent}%)
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-[#88C0D0]/15 border border-[#88C0D0]/30 flex flex-col items-center justify-center font-bold text-[#88C0D0]">
            <span className="text-sm font-extrabold font-mono">{overallPercent}%</span>
            <span className="text-[9px] uppercase tracking-wider text-[#81A1C1]">Progres</span>
          </div>
        </div>

        {/* Global Progress bar */}
        <div className="w-full bg-[#242933] rounded-full h-2.5 mt-4 overflow-hidden p-0.5 border border-[#434C5E]/50">
          <div
            className="h-full bg-gradient-to-r from-[#5E81AC] via-[#81A1C1] to-[#88C0D0] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      {/* Goal Cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#88C0D0]/20 border-t-[#88C0D0] rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-[#2E3440]/50 border border-[#434C5E]/50">
          <Target className="w-10 h-10 text-[#81A1C1]/40 mx-auto mb-2.5" />
          <p className="text-sm font-bold text-[#ECEFF4]">Belum Ada Target Tabungan</p>
          <p className="text-xs text-[#81A1C1] mt-1 max-w-xs mx-auto">
            Mulai rencanakan tabungan liburan, dana darurat, atau pembelian gadget impianmu.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const isCompleted = goal.status === "COMPLETED" || goal.currentAmount >= goal.targetAmount;
            const isExpanded = expandedGoalId === goal.id;

            return (
              <div
                key={goal.id}
                className="p-5 rounded-3xl bg-[#2E3440] border border-[#434C5E] hover:border-[#81A1C1]/40 shadow-sm transition-all"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#2E3440] shrink-0 shadow-md"
                      style={{ backgroundColor: goal.color }}
                    >
                      <CategoryIcon name={goal.icon} className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-[#ECEFF4] leading-tight">
                          {goal.name}
                        </h4>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A3BE8C]/20 text-[#A3BE8C] border border-[#A3BE8C]/40">
                            <CheckCircle className="w-3 h-3" /> Tercapai
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#88C0D0]/15 text-[#88C0D0] border border-[#88C0D0]/30 font-mono">
                            {goal.percentage}%
                          </span>
                        )}
                      </div>

                      {goal.targetWalletName && (
                        <p className="text-[11px] text-[#81A1C1] mt-0.5">
                          Tersimpan di: {goal.targetWalletName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedGoalForEdit(goal);
                        setIsGoalModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-[#81A1C1] hover:text-[#ECEFF4] hover:bg-[#3B4252] transition-colors"
                      title="Edit Target"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id, goal.name)}
                      className="p-2 rounded-xl text-[#81A1C1] hover:text-[#BF616A] hover:bg-[#BF616A]/15 transition-colors"
                      title="Hapus Target"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress amounts */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-[#81A1C1]">Terkumpul</span>
                    <p className="text-lg font-extrabold font-mono text-[#A3BE8C]">
                      {formatCurrency(goal.currentAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#81A1C1]">Target</span>
                    <p className="text-sm font-bold font-mono text-[#D8DEE9]">
                      {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                </div>

                {/* Animated Progress bar */}
                <div className="w-full bg-[#242933] rounded-full h-3 mt-2 overflow-hidden p-0.5 border border-[#434C5E]/50">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${goal.percentage}%`,
                      backgroundColor: goal.color || "#88C0D0",
                    }}
                  />
                </div>

                {/* Target insights: Days remaining & recommended monthly */}
                {!isCompleted && (
                  <div className="mt-3 flex items-center justify-between text-xs text-[#81A1C1] bg-[#242933]/60 p-2.5 rounded-xl border border-[#434C5E]/40">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#88C0D0]" />
                      <span>
                        {goal.daysRemaining !== null
                          ? `${goal.daysRemaining} hari lagi`
                          : "Tanpa batas waktu"}
                      </span>
                    </div>

                    {goal.recommendedMonthly > 0 && (
                      <div className="flex items-center gap-1 text-[#EBCB8B] font-medium">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Saran: {formatCurrency(goal.recommendedMonthly)}/bln</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-4 pt-3 border-t border-[#434C5E]/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedGoalForAlloc(goal);
                      setIsAllocModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-bold shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Setor / Tarik Dana
                  </button>

                  <button
                    onClick={() =>
                      setExpandedGoalId(isExpanded ? null : goal.id)
                    }
                    className="py-2 px-3 rounded-xl bg-[#3B4252] text-[#D8DEE9] hover:text-[#ECEFF4] text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Histori ({goal.logs.length})</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Accordion: Allocation Logs */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-[#434C5E]/60 space-y-2 animate-fade-in">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#81A1C1]">
                      Riwayat Alokasi Dana
                    </h5>
                    {goal.logs.length === 0 ? (
                      <p className="text-xs text-[#81A1C1] italic py-2">
                        Belum ada mutasi alokasi untuk target ini.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {goal.logs.map((log) => (
                          <div
                            key={log.id}
                            className="p-2.5 rounded-xl bg-[#242933] border border-[#434C5E]/50 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              {log.type === "DEPOSIT" ? (
                                <div className="w-6 h-6 rounded-lg bg-[#A3BE8C]/20 text-[#A3BE8C] flex items-center justify-center">
                                  <ArrowDownRight className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-[#D08770]/20 text-[#D08770] flex items-center justify-center">
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-[#ECEFF4] block">
                                  {log.type === "DEPOSIT" ? "Setoran Tabungan" : "Penarikan Dana"}
                                </span>
                                <span className="text-[10px] text-[#81A1C1]">
                                  {formatDate(log.date)} • {log.walletName || "Dompet"}
                                  {log.notes ? ` • ${log.notes}` : ""}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`font-mono font-bold ${
                                log.type === "DEPOSIT" ? "text-[#A3BE8C]" : "text-[#D08770]"
                              }`}
                            >
                              {log.type === "DEPOSIT" ? "+" : "-"}
                              {formatCurrency(log.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        existingGoal={selectedGoalForEdit}
        wallets={wallets}
        onSuccess={triggerRefresh}
      />

      <GoalAllocationModal
        isOpen={isAllocModalOpen}
        onClose={() => setIsAllocModalOpen(false)}
        goal={selectedGoalForAlloc}
        wallets={wallets}
        onSuccess={triggerRefresh}
      />
    </div>
  );
}
