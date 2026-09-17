"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Sparkles,
  Shield,
  Gift,
  Coins,
  Flame,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { MintedCoinCard, MintedCoinCardProps } from "@/components/gamification/MintedCoinCard";
import { CreateVoucherModal } from "@/components/gamification/CreateVoucherModal";
import { formatCurrency } from "@/lib/utils/format";
import Link from "next/link";
import { FrostSummary } from "@/lib/gamification/frostEngine";
import { AegisSummary, EnrichedCrack } from "@/lib/gamification/aegisEngine";
import { EnrichedShopItem, EnrichedRedemption } from "@/lib/gamification/shopEngine";

type VaultTab = "coins" | "aegis" | "shop";

interface ShopData {
  shardBalance: number;
  vouchers: EnrichedShopItem[];
  virtualItems: EnrichedShopItem[];
}

interface InventoryData {
  activeVouchers: EnrichedRedemption[];
  usedVouchers: EnrichedRedemption[];
  virtualCollection: EnrichedRedemption[];
}

export default function VaultPage() {
  const { isGamificationEnabled } = useApp();
  const [activeTab, setActiveTab] = useState<VaultTab>("coins");

  // Data States
  const [frostData, setFrostData] = useState<FrostSummary | null>(null);
  const [aegisData, setAegisData] = useState<AegisSummary | null>(null);
  const [goalsData, setGoalsData] = useState<MintedCoinCardProps["goal"][]>([]);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [coinFilter, setCoinFilter] = useState<"ALL" | "IN_PROGRESS" | "COMPLETED">("ALL");
  const [shopSubTab, setShopSubTab] = useState<"CATALOG" | "BACKPACK">("CATALOG");

  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAllVaultData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [frostRes, aegisRes, goalsRes, shopRes, invRes] = await Promise.all([
        fetch("/api/gamification/frost"),
        fetch("/api/gamification/aegis"),
        fetch("/api/goals"),
        fetch("/api/gamification/shop"),
        fetch("/api/gamification/inventory"),
      ]);

      if (frostRes.ok) setFrostData(await frostRes.json());
      if (aegisRes.ok) setAegisData(await aegisRes.json());
      if (goalsRes.ok) {
        const g = await goalsRes.json();
        setGoalsData(g.goals || []);
      }
      if (shopRes.ok) setShopData(await shopRes.json());
      if (invRes.ok) setInventoryData(await invRes.json());
    } catch (err) {
      console.error("Error loading vault page data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllVaultData();
  }, [fetchAllVaultData]);

  // Handle Minor Crack Repair
  const handleRepairCrack = async (crackId: string) => {
    try {
      setActionMessage(null);
      const res = await fetch("/api/gamification/aegis/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crackId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbaiki retak perisai.");
      }

      setActionMessage({ type: "success", text: "Rune of Mending berhasil menambal retak perisai!" });
      fetchAllVaultData();
    } catch (err: unknown) {
      setActionMessage({ type: "error", text: (err as Error)?.message || "Terjadi kesalahan." });
    }
  };

  // Handle Shop Redemption
  const handleRedeemItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Tukarkan Frost Shards untuk mendapatkan "${itemName}"?`)) return;

    try {
      setActionMessage(null);
      const res = await fetch("/api/gamification/shop/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menukarkan item.");
      }

      setActionMessage({ type: "success", text: `Selamat! "${itemName}" berhasil diperoleh dan masuk ke inventaris.` });
      fetchAllVaultData();
    } catch (err: unknown) {
      setActionMessage({ type: "error", text: (err as Error)?.message || "Gagal menukarkan item." });
    }
  };

  // Filtered Goals
  const filteredGoals = goalsData.filter((g) => {
    if (coinFilter === "IN_PROGRESS") return g.status !== "COMPLETED";
    if (coinFilter === "COMPLETED") return g.status === "COMPLETED";
    return true;
  });

  return (
    <div className="py-4 space-y-6 pb-24 max-w-xl mx-auto">
      {/* Toast Alert Message */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fade-in border ${
            actionMessage.type === "success"
              ? "bg-[#A3BE8C]/15 border-[#A3BE8C]/30 text-[#A3BE8C]"
              : "bg-[#BF616A]/15 border-[#BF616A]/30 text-[#BF616A]"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100 ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Warning if Gamification Disabled */}
      {!isGamificationEnabled && (
        <div className="p-4 rounded-2xl bg-[#EBCB8B]/15 border border-[#EBCB8B]/30 text-[#EBCB8B] text-xs flex items-center justify-between gap-3">
          <div>
            <p className="font-bold">Mode Gamifikasi Sedang Dinonaktifkan</p>
            <p className="opacity-90">Aktifkan sakelar di Pengaturan untuk menikmati fitur ini secara penuh.</p>
          </div>
          <Link
            href="/settings"
            className="px-3 py-1.5 rounded-xl bg-[#EBCB8B] text-[#2E3440] font-bold text-xs shrink-0"
          >
            Nyalakan
          </Link>
        </div>
      )}

      {/* Vault Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2E3440] via-[#262C38] to-[#1E222A] p-6 border border-[#88C0D0]/30 shadow-2xl shadow-[#88C0D0]/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-[#88C0D0]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-36 h-36 rounded-full bg-[#5E81AC]/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5E81AC] via-[#81A1C1] to-[#88C0D0] flex items-center justify-center text-[#2E3440] shadow-lg shadow-[#88C0D0]/30 text-xl font-black ring-2 ring-[#ECEFF4]/20">
                ᚱ
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold tracking-widest uppercase text-[#88C0D0]">
                    Nordic Sanctuary
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#88C0D0]/15 text-[#88C0D0] border border-[#88C0D0]/30">
                    Vault v1.0
                  </span>
                </div>
                <h1 className="text-xl font-extrabold text-[#ECEFF4] tracking-tight">
                  The Nordic Vault
                </h1>
              </div>
            </div>

            {/* Frost Shards Counter Pill */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#242933]/90 border border-[#88C0D0]/40 shadow-inner">
                <Image
                  src="/images/gamification/frost_shard.png"
                  alt="Frost Shard"
                  width={20}
                  height={20}
                  className="object-contain filter drop-shadow select-none"
                  style={{ imageRendering: "pixelated" }}
                />
                <span className="text-base font-black text-[#ECEFF4] font-mono">
                  {frostData?.balance ?? 0}
                </span>
                <span className="text-[10px] font-bold text-[#88C0D0] uppercase">Shards</span>
              </div>
              {frostData && frostData.currentStreak > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#EBCB8B] mt-1 mr-1">
                  <Flame className="w-3 h-3 text-[#EBCB8B]" /> {frostData.currentStreak} Hari Streak
                </span>
              )}
            </div>
          </div>

          {/* KPI Mini Row */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#434C5E]/50">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#242933]/70 border border-[#434C5E]/40">
              <div className="w-8 h-8 rounded-lg bg-[#242933] border border-[#88C0D0]/30 flex items-center justify-center p-1 shrink-0">
                <Image
                  src="/images/gamification/frost_shard.png"
                  alt="Status"
                  width={20}
                  height={20}
                  className="object-contain filter drop-shadow select-none"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
              <div>
                <p className="text-[10px] text-[#81A1C1] font-medium">Status Hari Ini</p>
                <p className="text-xs font-bold text-[#ECEFF4]">
                  {frostData?.todayStatus === "no_spend_active" ? "Aman (No-Spend)" : "Ada Konsumtif"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#242933]/70 border border-[#434C5E]/40">
              <div className="w-8 h-8 rounded-lg bg-[#242933] border border-[#88C0D0]/30 flex items-center justify-center p-1 shrink-0">
                <Image
                  src="/images/gamification/aegis_shield.png"
                  alt="Aegis"
                  width={22}
                  height={22}
                  className="object-contain filter drop-shadow select-none"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
              <div>
                <p className="text-[10px] text-[#81A1C1] font-medium">Aegis Barrier</p>
                <p
                  className="text-xs font-extrabold font-mono"
                  style={{ color: aegisData?.statusDetails?.color || "#88C0D0" }}
                >
                  {aegisData?.integrity ?? 100}% Integritas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-[#2E3440] border border-[#434C5E]/70 shadow-inner">
        <button
          onClick={() => setActiveTab("coins")}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all tap-effect ${
            activeTab === "coins"
              ? "bg-[#88C0D0] text-[#2E3440] shadow-md shadow-[#88C0D0]/20 font-extrabold"
              : "text-[#D8DEE9] hover:text-[#ECEFF4] hover:bg-[#3B4252]"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>The Forge</span>
        </button>

        <button
          onClick={() => setActiveTab("aegis")}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all tap-effect ${
            activeTab === "aegis"
              ? "bg-[#88C0D0] text-[#2E3440] shadow-md shadow-[#88C0D0]/20 font-extrabold"
              : "text-[#D8DEE9] hover:text-[#ECEFF4] hover:bg-[#3B4252]"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Aegis Sanctum</span>
        </button>

        <button
          onClick={() => setActiveTab("shop")}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all tap-effect ${
            activeTab === "shop"
              ? "bg-[#88C0D0] text-[#2E3440] shadow-md shadow-[#88C0D0]/20 font-extrabold"
              : "text-[#D8DEE9] hover:text-[#ECEFF4] hover:bg-[#3B4252]"
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Vault Shop</span>
        </button>
      </div>

      {/* TAB 1: THE FORGE & TROPHY CABINET */}
      {activeTab === "coins" && (
        <div className="space-y-4 animate-fade-in">
          {/* Subheader & Filter */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#ECEFF4]">Penempaan Koin Nordik</h2>
              <p className="text-xs text-[#81A1C1]">Koin berevolusi seiring tabungan bertambah</p>
            </div>

            <div className="flex items-center gap-1 bg-[#242933] p-1 rounded-xl border border-[#434C5E]">
              {(["ALL", "IN_PROGRESS", "COMPLETED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCoinFilter(filter)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    coinFilter === filter
                      ? "bg-[#3B4252] text-[#88C0D0] shadow-sm"
                      : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
                  }`}
                >
                  {filter === "ALL" ? "Semua" : filter === "IN_PROGRESS" ? "Tempa" : "Trofi"}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Coins Grid */}
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-36 rounded-2xl bg-[#2E3440]/60" />
              <div className="h-36 rounded-2xl bg-[#2E3440]/60" />
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center p-8 rounded-2xl bg-[#2E3440]/40 border border-[#434C5E]/50 space-y-3">
              <Coins className="w-10 h-10 text-[#4C566A] mx-auto" />
              <div>
                <p className="text-sm font-bold text-[#ECEFF4]">Belum Ada Koin Tabungan</p>
                <p className="text-xs text-[#81A1C1] mt-0.5">
                  Buat target tabungan baru untuk mulai menempa koin Nordik Anda.
                </p>
              </div>
              <Link
                href="/goals"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#88C0D0] text-[#2E3440] text-xs font-bold shadow-md shadow-[#88C0D0]/20 tap-effect"
              >
                <span>Buka Menu Tabungan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGoals.map((g) => (
                <MintedCoinCard key={g.id} goal={g} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AEGIS SANCTUM */}
      {activeTab === "aegis" && (
        <div className="space-y-5 animate-fade-in">
          {/* Large Interactive Shield Widget */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#2E3440] to-[#242933] p-6 border border-[#434C5E] text-center space-y-4 shadow-xl">
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              {/* Outer Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="#3B4252"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke={aegisData?.statusDetails?.color || "#88C0D0"}
                  strokeWidth="10"
                  strokeDasharray={390}
                  strokeDashoffset={390 - (390 * (aegisData?.integrity ?? 100)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Shield Core with Pixel Art */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Image
                  src="/images/gamification/aegis_shield.png"
                  alt="Aegis Shield"
                  width={44}
                  height={44}
                  className="object-contain filter drop-shadow select-none mb-1"
                  style={{ imageRendering: "pixelated" }}
                />
                <span className="text-xl font-black font-mono text-[#ECEFF4]">
                  {aegisData?.integrity ?? 100}%
                </span>
                <span className="text-[10px] text-[#81A1C1] font-bold uppercase">Integritas</span>
              </div>
            </div>

            <div>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-1.5"
                style={{
                  backgroundColor: `${aegisData?.statusDetails?.color || "#88C0D0"}20`,
                  color: aegisData?.statusDetails?.color || "#88C0D0",
                  border: `1px solid ${aegisData?.statusDetails?.color || "#88C0D0"}40`,
                }}
              >
                {aegisData?.statusDetails?.badge || "Utuh Sempurna"}
              </div>
              <h3 className="text-base font-bold text-[#ECEFF4]">
                {aegisData?.statusDetails?.label || "Aegis Barrier"}
              </h3>
              <p className="text-xs text-[#81A1C1] max-w-sm mx-auto mt-1">
                {aegisData?.statusDetails?.description}
              </p>
            </div>
          </div>

          {/* Cracks Breakdown Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#ECEFF4]">
                Keretakan Anggaran Bulan Ini ({aegisData?.cracks?.length || 0})
              </h3>
              {aegisData?.canRepairAny && (
                <span className="text-xs text-[#88C0D0] font-semibold">
                  Tersedia Retak yang Bisa Ditempal
                </span>
              )}
            </div>

            {aegisData?.cracks?.length === 0 ? (
              <div className="p-5 rounded-2xl bg-[#A3BE8C]/10 border border-[#A3BE8C]/30 text-center space-y-1.5">
                <CheckCircle2 className="w-8 h-8 text-[#A3BE8C] mx-auto" />
                <p className="text-xs font-bold text-[#A3BE8C]">Pertahanan Anggaran Sempurna!</p>
                <p className="text-[11px] text-[#D8DEE9]/80">
                  Tidak ada kategori yang overspend bulan ini. Perisai berdiri tegak 100%.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {aegisData?.cracks?.map((crack: EnrichedCrack) => (
                  <div
                    key={crack.id}
                    className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                        style={{
                          backgroundColor: `${crack.categoryColor}25`,
                          color: crack.categoryColor,
                        }}
                      >
                        {crack.isMinor ? (
                          <AlertTriangle className="w-5 h-5 text-[#EBCB8B]" />
                        ) : (
                          <Lock className="w-5 h-5 text-[#BF616A]" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[#ECEFF4]">{crack.categoryName}</h4>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              crack.isMinor
                                ? "bg-[#EBCB8B]/15 text-[#EBCB8B] border border-[#EBCB8B]/30"
                                : "bg-[#BF616A]/15 text-[#BF616A] border border-[#BF616A]/30"
                            }`}
                          >
                            {crack.isMinor ? "Retak Ringan (≤10%)" : "Retak Mayor (>10%)"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#81A1C1] mt-0.5 font-mono">
                          Overspend: <b className="text-[#ECEFF4]">{formatCurrency(crack.overspendAmount)}</b> ({crack.overspendPercentage}%)
                        </p>
                      </div>
                    </div>

                    {/* Action button */}
                    {crack.repaired ? (
                      <span className="text-[10px] font-bold text-[#A3BE8C] bg-[#A3BE8C]/15 px-2.5 py-1 rounded-xl border border-[#A3BE8C]/30 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Tertambal
                      </span>
                    ) : crack.isMinor ? (
                      <button
                        onClick={() => handleRepairCrack(crack.id)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-bold shadow-md shadow-[#88C0D0]/20 flex items-center gap-1.5 shrink-0 hover:brightness-110 tap-effect"
                        title="Perbaiki retak menggunakan 1 Frost Shard"
                      >
                        <Image
                          src="/images/gamification/rune_repair_stone.png"
                          alt="Rune"
                          width={16}
                          height={16}
                          className="object-contain filter drop-shadow select-none"
                          style={{ imageRendering: "pixelated" }}
                        />
                        <span>Rune (1 Shard)</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-[#BF616A] bg-[#BF616A]/15 px-2 py-1 rounded-xl border border-[#BF616A]/30 shrink-0">
                        Permanen
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: THE VAULT SHOP & BACKPACK */}
      {activeTab === "shop" && (
        <div className="space-y-4 animate-fade-in">
          {/* Shop Header & Subtab */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#ECEFF4]">The Vault Shop</h2>
              <p className="text-xs text-[#81A1C1]">Tukarkan kristal es hasil kedisiplinan Anda</p>
            </div>

            <div className="flex items-center gap-1 bg-[#242933] p-1 rounded-xl border border-[#434C5E]">
              <button
                onClick={() => setShopSubTab("CATALOG")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  shopSubTab === "CATALOG"
                    ? "bg-[#3B4252] text-[#88C0D0] shadow-sm"
                    : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
                }`}
              >
                Katalog Toko
              </button>
              <button
                onClick={() => setShopSubTab("BACKPACK")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  shopSubTab === "BACKPACK"
                    ? "bg-[#3B4252] text-[#88C0D0] shadow-sm"
                    : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
                }`}
              >
                Ransel ({inventoryData?.activeVouchers?.length || 0})
              </button>
            </div>
          </div>

          {/* Subtab: CATALOG */}
          {shopSubTab === "CATALOG" && (
            <div className="space-y-6">
              {/* Type A: Guilt-Free Vouchers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-[#D08770]" />
                    <h3 className="text-sm font-bold text-[#ECEFF4]">Kupon Self-Reward Pribadi</h3>
                  </div>
                  <button
                    onClick={() => setIsVoucherModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#88C0D0] hover:text-[#ECEFF4] bg-[#88C0D0]/10 hover:bg-[#88C0D0]/20 px-2.5 py-1 rounded-xl border border-[#88C0D0]/30 transition-all tap-effect"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Buat Kupon</span>
                  </button>
                </div>

                {shopData?.vouchers?.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#2E3440]/40 border border-[#434C5E]/50 text-center text-xs text-[#81A1C1]">
                    Belum ada kupon hadiah kustom. Klik tombol di atas untuk membuat hadiah self-reward pertama Anda!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {shopData?.vouchers?.map((v: EnrichedShopItem) => (
                      <div
                        key={v.id}
                        className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] flex flex-col justify-between gap-3 shadow-md hover:border-[#88C0D0]/50 transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-[#242933] border border-[#88C0D0]/30 flex items-center justify-center p-0.5 shrink-0">
                                <Image
                                  src="/images/gamification/voucher_ticket.png"
                                  alt="Ticket"
                                  width={28}
                                  height={28}
                                  className="object-contain filter drop-shadow select-none"
                                  style={{ imageRendering: "pixelated" }}
                                />
                              </div>
                              <h4 className="text-sm font-bold text-[#ECEFF4] leading-snug">{v.name}</h4>
                            </div>
                            <span className="text-xs font-bold text-[#88C0D0] bg-[#88C0D0]/15 px-2 py-0.5 rounded-lg shrink-0 font-mono flex items-center gap-1">
                              <Image
                                src="/images/gamification/frost_shard.png"
                                alt="Cost"
                                width={12}
                                height={12}
                                className="object-contain select-none"
                                style={{ imageRendering: "pixelated" }}
                              />
                              {v.shardCost}
                            </span>
                          </div>
                          {v.description && (
                            <p className="text-[11px] text-[#81A1C1] mt-1 leading-normal">{v.description}</p>
                          )}
                          <div className="mt-2.5 text-xs text-[#D8DEE9]">
                            Maks. Belanja: <b className="text-[#EBCB8B]">{formatCurrency(v.userDefinedCap || 0)}</b>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRedeemItem(v.id, v.name)}
                          disabled={!v.canAfford}
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-bold hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 transition-all shadow-sm tap-effect"
                        >
                          {v.canAfford ? "Tukarkan Hadiah" : "Shards Belum Cukup"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Type B: Virtual Perks & Ornaments */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#88C0D0]" />
                  <h3 className="text-sm font-bold text-[#ECEFF4]">Ornamen & Gelar Nordik</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shopData?.virtualItems?.map((item: EnrichedShopItem) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] flex flex-col justify-between gap-3 shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-[#ECEFF4] leading-snug">{item.name}</h4>
                          <span className="text-xs font-bold text-[#88C0D0] bg-[#88C0D0]/15 px-2 py-0.5 rounded-lg shrink-0 font-mono">
                            {item.shardCost} 🧊
                          </span>
                        </div>
                        <p className="text-[11px] text-[#81A1C1] mt-1 leading-normal">{item.description}</p>
                      </div>

                      {item.isOwned ? (
                        <div className="w-full py-2 rounded-xl bg-[#A3BE8C]/15 border border-[#A3BE8C]/30 text-[#A3BE8C] text-xs font-bold text-center flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dimiliki
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRedeemItem(item.id, item.name)}
                          disabled={!item.canAfford}
                          className="w-full py-2 rounded-xl bg-[#3B4252] hover:bg-[#434C5E] text-[#ECEFF4] text-xs font-bold disabled:opacity-40 transition-all tap-effect"
                        >
                          {item.canAfford ? "Beli Ornamen" : "Shards Belum Cukup"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Subtab: BACKPACK (INVENTORY) */}
          {shopSubTab === "BACKPACK" && (
            <div className="space-y-4 animate-fade-in">
              {/* Active Vouchers */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#88C0D0]">
                  Kupon Aktif Siap Pakai ({inventoryData?.activeVouchers?.length || 0})
                </h3>

                {inventoryData?.activeVouchers?.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#2E3440]/40 border border-[#434C5E]/50 text-center text-xs text-[#81A1C1]">
                    Ransel Anda kosong. Tukarkan Frost Shards di toko untuk mendapatkan kupon self-reward!
                  </div>
                ) : (
                  inventoryData?.activeVouchers?.map((v: EnrichedRedemption) => (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl bg-gradient-to-r from-[#2E3440] to-[#262C38] border border-[#88C0D0]/40 flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#242933] border border-[#88C0D0]/30 flex items-center justify-center p-1 shrink-0">
                          <Image
                            src="/images/gamification/voucher_ticket.png"
                            alt="Voucher"
                            width={32}
                            height={32}
                            className="object-contain filter drop-shadow select-none"
                            style={{ imageRendering: "pixelated" }}
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#ECEFF4]">{v.name}</h4>
                          <p className="text-xs text-[#81A1C1] mt-0.5">
                            Batas Maksimal Belanja: <b className="text-[#88C0D0]">{formatCurrency(v.userDefinedCap || 0)}</b>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-[#88C0D0]/15 text-[#88C0D0] border border-[#88C0D0]/30 shrink-0">
                        Aktif
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Owned Virtual Cosmetics */}
              <div className="space-y-2.5 pt-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#EBCB8B]">
                  Koleksi Gelar & Ornamen ({inventoryData?.virtualCollection?.length || 0})
                </h3>

                {inventoryData?.virtualCollection?.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#2E3440]/40 border border-[#434C5E]/50 text-center text-xs text-[#81A1C1]">
                    Belum ada ornamen virtual yang dikoleksi.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {inventoryData?.virtualCollection?.map((item: EnrichedRedemption) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-[#2E3440] border border-[#434C5E] space-y-1 shadow-sm"
                      >
                        <div className="flex items-center gap-1.5 text-[#EBCB8B] text-xs font-bold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{item.name}</span>
                        </div>
                        <p className="text-[10px] text-[#81A1C1]">Ornamen Profil Nordik</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Create Voucher */}
      <CreateVoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        onSuccess={() => {
          setActionMessage({ type: "success", text: "Voucher self-reward baru berhasil dibuat!" });
          fetchAllVaultData();
        }}
      />
    </div>
  );
}
