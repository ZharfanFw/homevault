"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { CategoryIcon } from "@/lib/utils/icons";
import { ArrowLeftRight, Trash2, Edit2, ChevronRight } from "lucide-react";
import Link from "next/link";

export interface TransactionItem {
  id: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: number;
  date: string;
  notes?: string | null;
  walletId?: string;
  destinationWalletId?: string | null;
  categoryId?: string | null;
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
  onEditTransaction?: (tx: TransactionItem) => void;
  onDeleteTransaction?: (id: string) => void;
  showAllLink?: boolean;
}

export function RecentTransactions({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  showAllLink = true,
}: RecentTransactionsProps) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#81A1C1]">
          Transaksi Terakhir
        </h3>
        {showAllLink && (
          <Link
            href="/transactions"
            className="text-xs font-semibold text-[#88C0D0] hover:text-[#ECEFF4] flex items-center gap-0.5 tap-effect transition-colors"
          >
            Semua Transaksi <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="p-8 text-center bg-[#2E3440]/60 border border-[#434C5E] rounded-2xl">
          <p className="text-xs text-[#D8DEE9]/60">Belum ada transaksi bulan ini.</p>
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
              ? "#88C0D0"
              : isIncome
              ? tx.categoryColor || "#A3BE8C"
              : tx.categoryColor || "#BF616A";

            return (
              <div
                key={tx.id}
                onClick={() => onEditTransaction && onEditTransaction(tx)}
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#2E3440] border border-[#434C5E]/70 hover:border-[#81A1C1] shadow-sm transition-all cursor-pointer tap-effect"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[#2E3440] shrink-0 shadow-sm ring-1 ring-white/10"
                    style={{ backgroundColor: iconBg }}
                  >
                    {isTransfer ? (
                      <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <CategoryIcon name={iconName} className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#ECEFF4] truncate">
                      {isTransfer
                        ? `Transfer ke ${tx.destinationWalletName || "Dompet"}`
                        : tx.categoryName || "Transaksi"}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#D8DEE9]/70 mt-0.5">
                      <span className="truncate text-[#81A1C1] font-medium">
                        {tx.walletName || "Dompet"}
                      </span>
                      <span>•</span>
                      <span>{formatDate(tx.date)}</span>
                    </div>
                    {tx.notes && (
                      <p className="text-[10px] text-[#D8DEE9]/60 truncate mt-0.5 italic">
                        &ldquo;{tx.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 ml-3">
                  <span
                    className={`text-xs sm:text-sm font-extrabold font-mono ${
                      isExpense
                        ? "text-[#BF616A]"
                        : isIncome
                        ? "text-[#A3BE8C]"
                        : "text-[#88C0D0]"
                    }`}
                  >
                    {isExpense ? "-" : isIncome ? "+" : ""}
                    {formatCurrency(tx.amount)}
                  </span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {onEditTransaction && (
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 text-[#D8DEE9]/60 hover:text-[#88C0D0] rounded-lg hover:bg-[#3B4252] transition-all tap-effect"
                        aria-label="Ubah Transaksi"
                        title="Ubah"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteTransaction && (
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 text-[#D8DEE9]/60 hover:text-[#BF616A] rounded-lg hover:bg-[#3B4252] transition-all tap-effect"
                        aria-label="Hapus Transaksi"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
