"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { getMonthName } from "@/lib/utils/format";

export function Navbar({
  showMonthSelector = true,
  title,
}: {
  showMonthSelector?: boolean;
  title?: string;
}) {
  const { user, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } =
    useApp();

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <header className="sticky top-0 z-30 pt-safe px-4 pb-3 glass border-b border-[#434C5E]/70 transition-all">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
        {title ? (
          <h1 className="text-xl font-bold tracking-tight text-[#ECEFF4]">{title}</h1>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#5E81AC] to-[#88C0D0] flex items-center justify-center font-bold text-[#2E3440] shadow-md shadow-[#88C0D0]/20 text-sm ring-1 ring-[#ECEFF4]/20">
              {user?.name ? user.name[0].toUpperCase() : "H"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[#ECEFF4] leading-none">
                  {user?.name || "Pengguna"}
                </span>
                {user?.isAdmin && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#88C0D0]/15 text-[#88C0D0] border border-[#88C0D0]/30">
                    <ShieldCheck className="w-2.5 h-2.5" /> Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-[#81A1C1] leading-tight mt-0.5 tracking-wide">
                HomeVault
              </p>
            </div>
          </div>
        )}

        {showMonthSelector && (
          <div className="flex items-center bg-[#2E3440]/90 border border-[#434C5E] rounded-full px-2 py-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              aria-label="Bulan Sebelumnya"
              className="p-1 text-[#D8DEE9] hover:text-[#ECEFF4] rounded-full hover:bg-[#3B4252] tap-effect transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-[#ECEFF4] px-2 min-w-[95px] text-center font-mono">
              {getMonthName(selectedMonth - 1)} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              aria-label="Bulan Berikutnya"
              className="p-1 text-[#D8DEE9] hover:text-[#ECEFF4] rounded-full hover:bg-[#3B4252] tap-effect transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
