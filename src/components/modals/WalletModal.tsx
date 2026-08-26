"use client";

import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { COLOR_PALETTE, AVAILABLE_ICONS, CategoryIcon } from "@/lib/utils/icons";

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
      setInitialBalance(wallet.initialBalance.toString());
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
          initialBalance: parseInt(initialBalance, 10) || 0,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">
            {wallet ? "Edit Dompet" : "Tambah Dompet Baru"}
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
          {/* Name & Type */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Nama Dompet / Rekening
            </label>
            <input
              type="text"
              placeholder="Contoh: BCA Utama, GoPay, Tunai"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Tipe Dompet
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="BANK">Bank</option>
                <option value="EWALLET">E-Wallet</option>
                <option value="CASH">Uang Tunai</option>
                <option value="CREDIT_CARD">Kartu Kredit</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Saldo Awal (Rp)
              </label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Pilihan Warna
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full tap-effect flex items-center justify-center transition-all ${
                    color === c ? "ring-2 ring-white scale-110" : ""
                  }`}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
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
                      ? "bg-blue-600/20 border-blue-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
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
                className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="archiveWallet"
                className="text-xs font-medium text-slate-300 cursor-pointer"
              >
                Arsipkan dompet ini (tidak ditampilkan di beranda)
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 tap-effect flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Simpan Dompet"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
