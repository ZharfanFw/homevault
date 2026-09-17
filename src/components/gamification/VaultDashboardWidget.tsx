"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Flame, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function VaultDashboardWidget() {
  const { isGamificationEnabled } = useApp();
  const [frostData, setFrostData] = useState<{
    balance: number;
    currentStreak: number;
    todayStatus: "no_spend_active" | "consumptive_spent";
  } | null>(null);

  const [aegisData, setAegisData] = useState<{
    integrity: number;
    statusDetails: {
      label: string;
      color: string;
    };
    activeCracksCount: number;
    canRepairAny: boolean;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isGamificationEnabled) return;

    const fetchVaultSummary = async () => {
      try {
        setIsLoading(true);
        const [frostRes, aegisRes] = await Promise.all([
          fetch("/api/gamification/frost"),
          fetch("/api/gamification/aegis"),
        ]);

        if (frostRes.ok) {
          const fData = await frostRes.json();
          setFrostData({
            balance: fData.balance ?? 0,
            currentStreak: fData.currentStreak ?? 0,
            todayStatus: fData.todayStatus || "no_spend_active",
          });
        }

        if (aegisRes.ok) {
          const aData = await aegisRes.json();
          setAegisData({
            integrity: aData.integrity ?? 100,
            statusDetails: aData.statusDetails || {
              label: "Aegis Utuh",
              color: "#88C0D0",
            },
            activeCracksCount: aData.activeCracksCount ?? 0,
            canRepairAny: aData.canRepairAny ?? false,
          });
        }
      } catch (err) {
        console.error("Fetch vault dashboard summary error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVaultSummary();
  }, [isGamificationEnabled]);

  if (!isGamificationEnabled) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2E3440] via-[#2A2F3B] to-[#242933] border border-[#88C0D0]/30 p-4 sm:p-5 shadow-xl shadow-[#88C0D0]/10 transition-all hover:border-[#88C0D0]/50 animate-fade-in">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 rounded-full bg-[#88C0D0]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-28 h-28 rounded-full bg-[#5E81AC]/15 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#242933] border border-[#88C0D0]/40 flex items-center justify-center p-1 shadow-sm">
            <Image
              src="/images/gamification/frost_shard.png"
              alt="Vault"
              width={28}
              height={28}
              className="object-contain filter drop-shadow-sm select-none"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#88C0D0]">
                Nordic Vault
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#88C0D0]/15 text-[#88C0D0] border border-[#88C0D0]/30">
                Aktif
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#ECEFF4] leading-tight">
              Kesehatan & Disiplin Finansial
            </h3>
          </div>
        </div>

        <Link
          href="/vault"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#88C0D0] hover:text-[#ECEFF4] bg-[#88C0D0]/10 hover:bg-[#88C0D0]/20 px-2.5 py-1.5 rounded-xl border border-[#88C0D0]/30 transition-all tap-effect"
        >
          <span>Buka Vault</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-2.5 animate-pulse">
          <div className="h-16 rounded-xl bg-[#3B4252]/50" />
          <div className="h-16 rounded-xl bg-[#3B4252]/50" />
        </div>
      ) : (
        <div className="mt-3.5 grid grid-cols-2 gap-2.5 relative z-10">
          {/* Frost Shards & Streak */}
          <div className="p-3 rounded-xl bg-[#242933]/80 border border-[#434C5E]/50 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#81A1C1]">Frost Shards</span>
                {frostData && frostData.currentStreak > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-[#EBCB8B] bg-[#EBCB8B]/15 px-1.5 py-0.5 rounded-md border border-[#EBCB8B]/25">
                    <Flame className="w-2.5 h-2.5" /> {frostData.currentStreak}h Streak
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <Image
                  src="/images/gamification/frost_shard.png"
                  alt="Frost Shard"
                  width={24}
                  height={24}
                  className="object-contain filter drop-shadow select-none"
                  style={{ imageRendering: "pixelated" }}
                />
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-[#ECEFF4] font-mono tracking-tight">
                    {frostData?.balance ?? 0}
                  </span>
                  <span className="text-xs text-[#88C0D0] font-bold">Shards</span>
                </div>
              </div>
            </div>

            <div className="pt-0.5 flex items-center gap-1 text-[10px]">
              {frostData?.todayStatus === "no_spend_active" ? (
                <span className="text-[#A3BE8C] font-semibold flex items-center gap-1">
                  Hari ini aman (No-Spend)
                </span>
              ) : (
                <span className="text-[#BF616A] font-semibold flex items-center gap-1">
                  Ada belanja konsumtif
                </span>
              )}
            </div>
          </div>

          {/* Aegis Barrier */}
          <div className="p-3 rounded-xl bg-[#242933]/80 border border-[#434C5E]/50 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#81A1C1]">Aegis Barrier</span>
                <span className="text-[10px] font-semibold text-[#81A1C1]">
                  {aegisData?.statusDetails.label || "Utuh"}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <Image
                  src="/images/gamification/aegis_shield.png"
                  alt="Aegis Shield"
                  width={24}
                  height={24}
                  className="object-contain filter drop-shadow select-none"
                  style={{ imageRendering: "pixelated" }}
                />
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-lg font-black font-mono tracking-tight"
                    style={{ color: aegisData?.statusDetails.color || "#88C0D0" }}
                  >
                    {aegisData?.integrity ?? 100}%
                  </span>
                  <span className="text-xs text-[#81A1C1]">Integritas</span>
                </div>
              </div>
            </div>

            <div className="pt-0.5 flex items-center gap-1 text-[10px]">
              {aegisData && aegisData.activeCracksCount > 0 ? (
                <span className="text-[#EBCB8B] font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-[#EBCB8B]" />
                  {aegisData.activeCracksCount} kategori overspend
                </span>
              ) : (
                <span className="text-[#88C0D0] font-semibold">
                  🛡️ Perisai kokoh 100%
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
