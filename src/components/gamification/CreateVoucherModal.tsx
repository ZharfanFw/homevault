"use client";

import React, { useState } from "react";
import { X, Gift, Sparkles, Check, Coffee, BookOpen, Utensils, Music, Gamepad2, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface CreateVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_ICONS = [
  { key: "gift", label: "Hadiah", icon: Gift },
  { key: "coffee", label: "Kopi", icon: Coffee },
  { key: "utensils", label: "Makan", icon: Utensils },
  { key: "book-open", label: "Buku", icon: BookOpen },
  { key: "shopping-bag", label: "Belanja", icon: ShoppingBag },
  { key: "music", label: "Musik", icon: Music },
  { key: "gamepad-2", label: "Hobi", icon: Gamepad2 },
];

export function CreateVoucherModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateVoucherModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shardCost, setShardCost] = useState<number>(3);
  const [userDefinedCap, setUserDefinedCap] = useState<string>("50000");
  const [selectedIcon, setSelectedIcon] = useState("gift");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const capNum = parseInt(userDefinedCap.replace(/\D/g, ""), 10);
    if (!name.trim()) {
      setError("Nama voucher wajib diisi.");
      return;
    }
    if (!shardCost || shardCost <= 0) {
      setError("Biaya Frost Shard harus minimal 1.");
      return;
    }
    if (!capNum || capNum <= 0) {
      setError("Batas nominal belanja (cap) harus lebih dari Rp 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/gamification/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          shardCost,
          userDefinedCap: capNum,
          icon: selectedIcon,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat voucher.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as Error)?.message || "Terjadi kesalahan saat membuat voucher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E222A]/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#2E3440] border border-[#434C5E] rounded-3xl p-6 shadow-2xl space-y-5 text-[#ECEFF4]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D08770] to-[#EBCB8B] p-0.5 shadow-md">
              <div className="w-full h-full rounded-[14px] bg-[#2E3440] flex items-center justify-center text-[#EBCB8B]">
                <Gift className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold">Buat Kupon Self-Reward</h2>
              <p className="text-xs text-[#81A1C1]">
                Tentukan hadiah belanja tanpa rasa bersalah Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#3B4252] text-[#D8DEE9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#BF616A]/15 border border-[#BF616A]/30 text-[#BF616A] text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
              Nama Hadiah Self-Reward
            </label>
            <input
              type="text"
              placeholder="Contoh: Kopi Artisan Pilihan, Buku Impian..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#242933] border border-[#434C5E] text-[#ECEFF4] placeholder-[#4C566A] text-sm focus:outline-none focus:border-[#88C0D0]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
              Deskripsi Singkat (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Secangkir flat white di cafe favorit..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#242933] border border-[#434C5E] text-[#ECEFF4] placeholder-[#4C566A] text-sm focus:outline-none focus:border-[#88C0D0]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
                Biaya Frost Shards
              </label>
              <div className="flex items-center gap-1.5 bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2">
                <span className="text-base">🧊</span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={shardCost}
                  onChange={(e) => setShardCost(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-transparent text-[#ECEFF4] font-mono font-bold text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
                Batas Belanja (Cap Rp)
              </label>
              <div className="bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={userDefinedCap ? formatCurrency(parseInt(userDefinedCap.replace(/\D/g, ""), 10) || 0) : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setUserDefinedCap(raw);
                  }}
                  placeholder="Rp 50.000"
                  className="w-full bg-transparent text-[#ECEFF4] font-mono font-bold text-sm focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-1.5">
              Pilih Ikon Voucher
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {AVAILABLE_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = selectedIcon === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedIcon(item.key)}
                    className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs transition-all ${
                      isSelected
                        ? "bg-[#88C0D0]/20 border-[#88C0D0] text-[#88C0D0] font-bold shadow-sm"
                        : "bg-[#242933] border-[#434C5E] text-[#D8DEE9] hover:bg-[#3B4252]"
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Preview Note */}
          <div className="p-3 rounded-2xl bg-[#88C0D0]/10 border border-[#88C0D0]/20 text-xs text-[#81A1C1] space-y-1">
            <div className="flex items-center gap-1.5 text-[#88C0D0] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prinsip Guilt-Free Spending</span>
            </div>
            <p>
              Saat kupon ini di-redeem menggunakan <b>{shardCost} Frost Shards</b>, Anda bebas menikmati pengeluaran hingga <b>{formatCurrency(parseInt(userDefinedCap.replace(/\D/g, ""), 10) || 0)}</b> tanpa rasa bersalah.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#D8DEE9] hover:bg-[#3B4252] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-bold hover:brightness-110 shadow-md shadow-[#88C0D0]/20 flex items-center gap-1.5 disabled:opacity-50 transition-all tap-effect"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Voucher"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
