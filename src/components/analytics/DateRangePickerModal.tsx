"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Calendar, Check, RotateCcw } from "lucide-react";
import { getDateRangePresets, formatDateRangeLabel } from "@/lib/utils/dateRange";

interface DateRangePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFrom?: string;
  currentTo?: string;
  onApply: (from: string, to: string) => void;
  onReset?: () => void;
}

export function DateRangePickerModal({
  isOpen,
  onClose,
  currentFrom,
  currentTo,
  onApply,
  onReset,
}: DateRangePickerModalProps) {
  const presets = useMemo(() => getDateRangePresets(), []);
  const [from, setFrom] = useState(currentFrom || "");
  const [to, setTo] = useState(currentTo || "");
  const [activePresetKey, setActivePresetKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFrom(currentFrom || "");
      setTo(currentTo || "");

      // Check if current matches any preset
      if (currentFrom && currentTo) {
        const found = presets.find((p) => {
          const r = p.getRange();
          return r.from === currentFrom && r.to === currentTo;
        });
        setActivePresetKey(found ? found.key : "CUSTOM");
      } else {
        setActivePresetKey(null);
      }
    }
  }, [isOpen, currentFrom, currentTo, presets]);

  if (!isOpen) return null;

  const handleSelectPreset = (key: string, getRange: () => { from: string; to: string }) => {
    const range = getRange();
    setFrom(range.from);
    setTo(range.to);
    setActivePresetKey(key);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) return;
    onApply(from, to);
    onClose();
  };

  const handleReset = () => {
    if (onReset) onReset();
    onClose();
  };

  const previewLabel = from && to ? formatDateRangeLabel(from, to) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#2E3440] border border-[#434C5E] rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#D8DEE9]/60 hover:text-[#ECEFF4] hover:bg-[#3B4252] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#88C0D0]/15 text-[#88C0D0] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#ECEFF4] leading-tight">
              Pilih Rentang Tanggal
            </h3>
            <p className="text-xs text-[#81A1C1]">
              Saring transaksi dan laporan berdasarkan periode kustom
            </p>
          </div>
        </div>

        {/* Active Range Preview */}
        {previewLabel && (
          <div className="my-3.5 p-2.5 rounded-xl bg-[#242933] border border-[#434C5E]/60 text-center">
            <span className="text-[11px] text-[#81A1C1] block">Periode Dipilih:</span>
            <span className="text-xs font-mono font-bold text-[#ECEFF4]">
              {previewLabel}
            </span>
          </div>
        )}

        <form onSubmit={handleApply} className="space-y-4">
          {/* Presets Chips */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-2">
              Pilihan Cepat (Presets)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleSelectPreset(p.key, p.getRange)}
                  className={`p-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center justify-between border ${
                    activePresetKey === p.key
                      ? "bg-[#3B4252] text-[#88C0D0] border-[#88C0D0]/40 shadow-sm"
                      : "bg-[#242933] text-[#D8DEE9]/80 border-[#434C5E]/50 hover:bg-[#3B4252]/50 hover:text-[#ECEFF4]"
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                  {activePresetKey === p.key && (
                    <Check className="w-3.5 h-3.5 shrink-0 text-[#88C0D0]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs */}
          <div>
            <label className="block text-xs font-semibold text-[#D8DEE9] mb-2">
              Atau Tentukan Tanggal Bebas
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <span className="text-[11px] text-[#81A1C1] block mb-1">Dari (Start):</span>
                <input
                  type="date"
                  required
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setActivePresetKey("CUSTOM");
                  }}
                  className="w-full px-3 py-2 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
                />
              </div>

              <div>
                <span className="text-[11px] text-[#81A1C1] block mb-1">Sampai (End):</span>
                <input
                  type="date"
                  required
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setActivePresetKey("CUSTOM");
                  }}
                  className="w-full px-3 py-2 bg-[#242933] border border-[#434C5E] rounded-xl text-xs text-[#ECEFF4] focus:outline-none focus:border-[#88C0D0]"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            {onReset && (
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-3 rounded-xl border border-[#434C5E] text-xs font-semibold text-[#81A1C1] hover:text-[#ECEFF4] hover:bg-[#3B4252] transition-colors flex items-center gap-1.5"
                title="Kembali ke tampilan bulan standar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#434C5E] text-xs font-bold text-[#D8DEE9] hover:bg-[#3B4252] transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={!from || !to}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-bold hover:brightness-110 shadow-lg shadow-[#88C0D0]/20 transition-all disabled:opacity-50"
            >
              Terapkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
