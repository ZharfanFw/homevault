"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils/format";
import { CategoryIcon } from "@/lib/utils/icons";

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number;
  percentage: number;
}

interface ExpenseCategoryBreakdownProps {
  categories: CategoryBreakdownItem[];
  totalExpense: number;
}

export function ExpenseCategoryBreakdown({
  categories,
  totalExpense,
}: ExpenseCategoryBreakdownProps) {
  if (categories.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
        <p className="text-xs text-slate-500">
          Tidak ada data pengeluaran pada periode ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Visual Multi-Segment Bar */}
      <div className="h-3 w-full rounded-full bg-slate-950 flex overflow-hidden p-0.5 border border-slate-800">
        {categories.map((cat, idx) => (
          <div
            key={idx}
            style={{
              width: `${Math.max(cat.percentage, 2)}%`,
              backgroundColor: cat.categoryColor || "#64748b",
            }}
            className="h-full rounded-full first:rounded-l-full last:rounded-r-full transition-all"
            title={`${cat.categoryName}: ${cat.percentage}%`}
          />
        ))}
      </div>

      {/* Categories List */}
      <div className="space-y-2.5 mt-4">
        {categories.map((cat) => (
          <div
            key={cat.categoryId || cat.categoryName}
            className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: cat.categoryColor || "#64748b" }}
                >
                  <CategoryIcon name={cat.categoryIcon} className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white truncate">
                  {cat.categoryName}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold font-mono text-white">
                  {formatCurrency(cat.totalAmount)}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 ml-1.5 font-mono">
                  ({cat.percentage}%)
                </span>
              </div>
            </div>

            {/* Individual category percentage bar */}
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.categoryColor || "#3b82f6",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
