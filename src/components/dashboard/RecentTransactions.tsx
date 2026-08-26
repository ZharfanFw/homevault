"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { CategoryIcon } from "@/lib/utils/icons";
import { ArrowLeftRight, Trash2, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

export interface TransactionItem {
  id: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: number;
  date: string;
  notes?: string | null;
  walletName?: string | null;
  walletColor?: string | null;
  destinationWalletName?: string | null;
  destinationWalletColor?: string | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  categoryColor?: string | null;
}

interface RecentTransactionsProps {
  transactions: TransactionItem[];
  onDeleteTransaction?: (id: string) => void;
  showAllLink?: boolean;
}

export function RecentTransactions({
  transactions,
  onDeleteTransaction,
  showAllLink = true,
}: RecentTransactionsProps) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Transaksi Terakhir
        </h3>
        {showAllLink && (
          <Link
            href="/transactions"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-0.5 tap-effect"
          >
            Semua Transaksi <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-500">Belum ada transaksi bulan ini.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => {
            const isExpense = tx.type === "EXPENSE";
            const isIncome = tx.type === "INCOME";
            const isTransfer = tx.type === "TRANSFER";

            const iconName = isTransfer
              ? "arrow-left-right"
              : tx.categoryIcon || "tag";
            const iconBg = isTransfer
              ? "#3b82f6"
              : isIncome
              ? tx.categoryColor || "#10b981"
              : tx.categoryColor || "#ef4444";

            return (
              <div
                key={tx.id}
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: iconBg }}
                  >
                    {isTransfer ? (
                      <ArrowLeftRight className="w-5 h-5" />
                    ) : (
                      <CategoryIcon name={iconName} className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">
                      {isTransfer
                        ? `Transfer ke ${tx.destinationWalletName || "Dompet"}`
                        : tx.categoryName || "Transaksi"}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span className="truncate">
                        {tx.walletName || "Dompet"}
                      </span>
                      <span>•</span>
                      <span>{formatDate(tx.date)}</span>
                    </div>
                    {tx.notes && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 italic">
                        &ldquo;{tx.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 ml-3">
                  <span
                    className={`text-xs sm:text-sm font-bold font-mono ${
                      isExpense
                        ? "text-red-400"
                        : isIncome
                        ? "text-emerald-400"
                        : "text-blue-400"
                    }`}
                  >
                    {isExpense ? "-" : isIncome ? "+" : ""}
                    {formatCurrency(tx.amount)}
                  </span>

                  {onDeleteTransaction && (
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1 text-slate-600 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity tap-effect"
                      aria-label="Hapus Transaksi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
