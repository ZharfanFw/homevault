"use client";

import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { COLOR_PALETTE, AVAILABLE_ICONS, CategoryIcon } from "@/lib/utils/icons";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: {
    id: string;
    name: string;
    type: "EXPENSE" | "INCOME";
    color: string;
    icon: string;
  } | null;
  defaultType?: "EXPENSE" | "INCOME";
  onSuccess: () => void;
}

export function CategoryModal({
  isOpen,
  onClose,
  category,
  defaultType = "EXPENSE",
  onSuccess,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [icon, setIcon] = useState("tag");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setColor(category.color);
      setIcon(category.icon);
    } else {
      setName("");
      setType(defaultType);
      setColor(COLOR_PALETTE[0]);
      setIcon("tag");
    }
    setError("");
  }, [category, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = category ? `/api/categories/${category.id}` : "/api/categories";
      const method = category ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          color,
          icon,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan kategori.");
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
            {category ? "Edit Kategori" : "Tambah Kategori Baru"}
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
              Tipe Kategori
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("EXPENSE")}
                className={`py-2 text-xs font-bold rounded-xl border tap-effect transition-all ${
                  type === "EXPENSE"
                    ? "bg-[#BF616A]/20 text-[#BF616A] border-[#BF616A]/40 shadow-sm"
                    : "bg-[#242933] border-[#434C5E] text-[#D8DEE9]"
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setType("INCOME")}
                className={`py-2 text-xs font-bold rounded-xl border tap-effect transition-all ${
                  type === "INCOME"
                    ? "bg-[#A3BE8C]/20 text-[#A3BE8C] border-[#A3BE8C]/40 shadow-sm"
                    : "bg-[#242933] border-[#434C5E] text-[#D8DEE9]"
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#D8DEE9] block mb-1">
              Nama Kategori
            </label>
            <input
              type="text"
              placeholder="Contoh: Kopi, Langganan, Hobi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#242933] border border-[#434C5E] rounded-xl px-3 py-2 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none"
              required
            />
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] hover:brightness-110 text-[#2E3440] font-extrabold text-xs shadow-lg shadow-[#88C0D0]/25 tap-effect flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-[#2E3440]/30 border-t-[#2E3440] rounded-full animate-spin" />
            ) : (
              "Simpan Kategori"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
