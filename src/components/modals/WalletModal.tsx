"use client";

import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { COLOR_PALETTE, AVAILABLE_ICONS, CategoryIcon } from "@/lib/utils/icons";
import { parseAmountInput, formatAmountInput } from "@/lib/utils/format";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet?: {
    id: string;
    name: string;
    type: string;
    initialBalance: number;
    color: string;
    icon: string;
    isArchived: boolean;
  } | null;
  onSuccess: () => void;
}

export function WalletModal({
  isOpen,
  onClose,
  wallet,
  onSuccess,
}: WalletModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("BANK");
  const [initialBalance, setInitialBalance] = useState("0");
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [icon, setIcon] = useState("wallet");
  const [isArchived, setIsArchived] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (wallet) {
      setName(wallet.name);
      setType(wallet.type);
      setInitialBalance(formatAmountInput(wallet.initialBalance));
      setColor(wallet.color);
      setIcon(wallet.icon);
      setIsArchived(wallet.isArchived);
    } else {
      setName("");
      setType("BANK");
      setInitialBalance("0");
      setColor(COLOR_PALETTE[0]);
      setIcon("wallet");
      setIsArchived(false);
    }
    setError("");
  }, [wallet, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nama dompet wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = wallet ? `/api/wallets/${wallet.id}` : "/api/wallets";
      const method = wallet ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          initialBalance: parseAmountInput(initialBalance),
          color,
          icon,
          isArchived,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan dompet.");
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
            {wallet ? "Edit Dompet" : "Tambah Dompet Baru"}
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
              Nama Dompet / Rekening
            </label>
            <input
              type="text"
              placeholder="Contoh: BCA Utama, GoPay, Tunai"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#D8DEE9] block mb-1">
                Tipe Dompet
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none"
              >
                <option value="BANK">Bank</option>
                <option value="EWALLET">E-Wallet</option>
                <option value="CASH">Uang Tunai</option>
                <option value="CREDIT_CARD">Kartu Kredit</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#D8DEE9] block mb-1">
                Saldo Awal (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={initialBalance}
                onChange={(e) => {
                  const raw = e.target.value;
                  const parsed = parseAmountInput(raw);
                  setInitialBalance(raw ? formatAmountInput(parsed) : "");
                }}
                placeholder="0"
                className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="text-xs font-semibold text-[#D8DEE9] block mb-1.5">
              Pilihan Warna (Nord Palette)
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full tap-effect flex items-center justify-center transition-all ${
                    color === c ? "ring-2 ring-white scale-110 shadow-md" : ""
                  }`}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-[#2E3440] stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-xs font-semibold text-[#D8DEE9] block mb-1.5">
              Pilihan Icon
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto no-scrollbar p-1">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-xl flex items-center justify-center tap-effect border transition-all ${
                    icon === ic
                      ? "bg-[#88C0D0]/20 border-[#88C0D0] text-[#ECEFF4]"
                      : "bg-[#242933] border-[#434C5E] text-[#D8DEE9] hover:border-[#81A1C1]"
                  }`}
                >
                  <CategoryIcon name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {wallet && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="archiveWallet"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="rounded bg-[#242933] border-[#434C5E] text-[#88C0D0] focus:ring-[#88C0D0]"
              />
              <label
                htmlFor="archiveWallet"
                className="text-xs font-medium text-[#D8DEE9] cursor-pointer"
              >
                Arsipkan dompet ini (tidak ditampilkan di beranda)
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] hover:brightness-110 text-[#2E3440] font-extrabold text-xs shadow-lg shadow-[#88C0D0]/25 tap-effect flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-[#2E3440]/30 border-t-[#2E3440] rounded-full animate-spin" />
            ) : (
              "Simpan Dompet"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
