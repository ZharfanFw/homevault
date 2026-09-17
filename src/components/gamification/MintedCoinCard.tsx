"use client";

import React from "react";
import { Sparkles, Shield, ChevronRight, CheckCircle2 } from "lucide-react";
import { CoinTier, CoinTierDetails } from "@/lib/gamification/coinEngine";
import { formatCurrency } from "@/lib/utils/format";

export interface MintedCoinCardProps {
  goal: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    peakAmount?: number | null;
    currentPercentage: number;
    peakPercentage: number;
    coinTier: CoinTier;
    coinDetails: CoinTierDetails;
    nextMilestone?: {
      nextTier: CoinTier;
      nextTierName: string;
      nextTierPercentage: number;
      amountNeeded: number;
      percentageRemaining: number;
    } | null;
    isFlawless?: boolean;
    status: "IN_PROGRESS" | "COMPLETED";
    completedAt?: Date | string | null;
  };
  onAllocate?: () => void;
}

export function MintedCoinCard({ goal, onAllocate }: MintedCoinCardProps) {
  const { coinDetails, nextMilestone } = goal;
  const isCompleted = goal.status === "COMPLETED";

  // Tier-specific styles
  const tierGradients: Record<CoinTier, { bg: string; border: string; glow: string; text: string }> = {
    raw_iron: {
      bg: "from-[#3B4252] via-[#434C5E] to-[#4C566A]",
      border: "border-[#4C566A]/80",
      glow: "shadow-[#4C566A]/20",
      text: "text-[#D8DEE9]",
    },
    bronze: {
      bg: "from-[#8F4F3D] via-[#BF616A]/70 to-[#D08770]",
      border: "border-[#D08770]/80",
      glow: "shadow-[#D08770]/30",
      text: "text-[#D08770]",
    },
    sterling_silver: {
      bg: "from-[#4C566A] via-[#D8DEE9] to-[#ECEFF4]",
      border: "border-[#E5E9F0]/80",
      glow: "shadow-[#E5E9F0]/40",
      text: "text-[#ECEFF4]",
    },
    nordic_amber: {
      bg: "from-[#D08770] via-[#EBCB8B] to-[#F5D77F]",
      border: "border-[#EBCB8B]/90",
      glow: "shadow-[#EBCB8B]/40",
      text: "text-[#EBCB8B]",
    },
    nordic_crystal: {
      bg: "from-[#5E81AC] via-[#81A1C1] to-[#88C0D0]",
      border: "border-[#88C0D0]",
      glow: "shadow-[#88C0D0]/50",
      text: "text-[#88C0D0]",
    },
  };

  const style = tierGradients[goal.coinTier] || tierGradients.raw_iron;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#2E3440]/90 to-[#242933]/95 p-5 border ${style.border} shadow-lg ${style.glow} transition-all duration-300 hover:translate-y-[-2px]`}
    >
      {/* Background Decorative Nordic Rune pattern glow */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none bg-gradient-to-tr from-transparent to-[#88C0D0]" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        {/* Coin Avatar / Physical Emblem */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${style.bg} p-0.5 shadow-md flex items-center justify-center ring-2 ring-[#ECEFF4]/10 transform transition-transform hover:rotate-6`}
          >
            <div className="w-full h-full rounded-[14px] bg-[#2E3440]/70 backdrop-blur-sm flex flex-col items-center justify-center">
              <span className="text-2xl select-none">{coinDetails.symbol}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#ECEFF4] leading-snug">
                {goal.name}
              </h3>
              {goal.isFlawless && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#88C0D0]/15 text-[#88C0D0] border border-[#88C0D0]/30" title="Flawless Coin: Diselesaikan dengan disiplin perisai penuh">
                  <Shield className="w-2.5 h-2.5" /> Flawless
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-semibold ${style.text}`}>
                {coinDetails.name}
              </span>
              <span className="text-[#4C566A]">•</span>
              <span className="text-[11px] font-mono text-[#81A1C1]">
                {coinDetails.nordicTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {isCompleted ? (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#A3BE8C]/20 text-[#A3BE8C] border border-[#A3BE8C]/40 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
          </div>
        ) : (
          <div className="text-right">
            <span className="text-sm font-extrabold text-[#ECEFF4] font-mono">
              {goal.currentPercentage}%
            </span>
            {goal.peakPercentage > goal.currentPercentage && (
              <p className="text-[10px] text-[#EBCB8B] font-medium" title="Penarikan dana tidak menurunkan tier koin">
                Peak: {goal.peakPercentage}% 🔒
              </p>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar with Tier Markers */}
      <div className="mt-4 space-y-1.5 relative z-10">
        <div className="flex justify-between text-xs text-[#81A1C1]">
          <span>Terkumpul: <b className="text-[#ECEFF4]">{formatCurrency(goal.currentAmount)}</b></span>
          <span>Target: <b className="text-[#ECEFF4]">{formatCurrency(goal.targetAmount)}</b></span>
        </div>

        <div className="h-2.5 w-full bg-[#242933] rounded-full overflow-hidden p-0.5 border border-[#434C5E]/50 relative">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${style.bg} transition-all duration-500 shadow-sm`}
            style={{ width: `${Math.min(100, goal.currentPercentage)}%` }}
          />
          {/* 25%, 50%, 75% tick marks */}
          <div className="absolute top-0 bottom-0 left-[25%] w-[1px] bg-[#ECEFF4]/30" />
          <div className="absolute top-0 bottom-0 left-[50%] w-[1px] bg-[#ECEFF4]/30" />
          <div className="absolute top-0 bottom-0 left-[75%] w-[1px] bg-[#ECEFF4]/30" />
        </div>
      </div>

      {/* Next Milestone Box (if in progress) */}
      {!isCompleted && nextMilestone && (
        <div className="mt-3.5 p-2.5 rounded-xl bg-[#242933]/70 border border-[#434C5E]/40 flex items-center justify-between gap-2 text-xs relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#EBCB8B] shrink-0" />
            <span className="text-[#D8DEE9]">
              Menuju <b className="text-[#ECEFF4]">{nextMilestone.nextTierName} ({nextMilestone.nextTierPercentage}%)</b>:
            </span>
          </div>
          <span className="font-mono font-semibold text-[#88C0D0]">
            +{formatCurrency(nextMilestone.amountNeeded)}
          </span>
        </div>
      )}

      {/* Completion Details if finished */}
      {isCompleted && goal.completedAt && (
        <div className="mt-3.5 p-2.5 rounded-xl bg-[#88C0D0]/10 border border-[#88C0D0]/30 flex items-center justify-between text-xs text-[#88C0D0] relative z-10">
          <span className="font-semibold">Mahakarya Koin Selesai</span>
          <span className="text-[11px] text-[#81A1C1]">
            {new Date(goal.completedAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      )}

      {/* Optional Quick Action */}
      {onAllocate && !isCompleted && (
        <button
          onClick={onAllocate}
          className="mt-3.5 w-full py-2 px-3 rounded-xl bg-[#3B4252] hover:bg-[#434C5E] text-[#ECEFF4] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors tap-effect"
        >
          <span>Tempa Tabungan (Setor / Tarik)</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
