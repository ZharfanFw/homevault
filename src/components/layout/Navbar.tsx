"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { ChevronLeft, ChevronRight, User, ShieldCheck } from "lucide-react";
import { getMonthName } from "@/lib/utils/format";
import Link from "next/link";

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
    <header className="sticky top-0 z-30 pt-safe px-4 pb-3 glass border-b border-slate-800/80 transition-all">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
        {title ? (
          <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 text-sm">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white leading-none">
                  {user?.name || "Pengguna"}
                </span>
                {user?.isAdmin && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <ShieldCheck className="w-2.5 h-2.5" /> Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Family Finance
              </p>
            </div>
          </div>
        )}

        {showMonthSelector && (
          <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-full px-2 py-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              aria-label="Bulan Sebelumnya"
              className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 tap-effect transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-slate-200 px-2 min-w-[95px] text-center">
              {getMonthName(selectedMonth - 1)} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              aria-label="Bulan Berikutnya"
              className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 tap-effect transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
