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
      <div className="p-8 text-center bg-[#2E3440]/60 border border-[#434C5E] rounded-2xl">
        <p className="text-xs text-[#D8DEE9]/60">
          Tidak ada data pengeluaran pada periode ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Visual Multi-Segment Bar */}
      <div className="h-3 w-full rounded-full bg-[#242933] flex overflow-hidden p-0.5 border border-[#434C5E]">
        {categories.map((cat, idx) => (
          <div
            key={idx}
            style={{
              width: `${Math.max(cat.percentage, 2)}%`,
              backgroundColor: cat.categoryColor || "#4C566A",
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
            className="p-3 rounded-2xl bg-[#2E3440] border border-[#434C5E]/80 shadow-sm"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2E3440] shrink-0 font-bold"
                  style={{ backgroundColor: cat.categoryColor || "#81A1C1" }}
                >
                  <CategoryIcon name={cat.categoryIcon} className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#ECEFF4] truncate">
                  {cat.categoryName}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold font-mono text-[#ECEFF4]">
                  {formatCurrency(cat.totalAmount)}
                </span>
                <span className="text-[11px] font-bold text-[#81A1C1] ml-1.5 font-mono">
                  ({cat.percentage}%)
                </span>
              </div>
            </div>

            {/* Individual category percentage bar */}
            <div className="w-full bg-[#242933] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.categoryColor || "#88C0D0",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
