"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { NetWorthCard } from "@/components/dashboard/NetWorthCard";
import { WalletList, WalletItem } from "@/components/dashboard/WalletList";
import {
  RecentTransactions,
  TransactionItem,
} from "@/components/dashboard/RecentTransactions";
import {
  ExpenseCategoryBreakdown,
  CategoryBreakdownItem,
} from "@/components/analytics/ExpenseCategoryBreakdown";
import { WalletModal } from "@/components/modals/WalletModal";
import { EditTransactionModal } from "@/components/modals/EditTransactionModal";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const {
    selectedMonth,
    selectedYear,
    refreshTrigger,
    triggerRefresh,
  } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [netWorth, setNetWorth] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [netCashflow, setNetCashflow] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    CategoryBreakdownItem[]
  >([]);
  const [recentTransactions, setRecentTransactions] = useState<
    TransactionItem[]
  >([]);
  const [wallets, setWallets] = useState<WalletItem[]>([]);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<TransactionItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [summaryRes, walletsRes] = await Promise.all([
        fetch(
          `/api/analytics/summary?month=${selectedMonth}&year=${selectedYear}`
        ),
        fetch("/api/wallets"),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setNetWorth(data.netWorth || 0);
        setMonthlyIncome(data.monthlyIncome || 0);
        setMonthlyExpense(data.monthlyExpense || 0);
        setNetCashflow(data.netCashflow || 0);
        setCategoryBreakdown(data.categoryBreakdown || []);
        setRecentTransactions(data.recentTransactions || []);
      }

      if (walletsRes.ok) {
        const wData = await walletsRes.json();
        setWallets(wData.wallets || []);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTrigger]);

  const handleEditTransaction = (tx: TransactionItem) => {
    setSelectedTxForEdit(tx);
    setIsEditModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerRefresh();
      }
    } catch (e) {
      console.error("Delete transaction error:", e);
    }
  };

  return (
    <div className="py-4 space-y-6">
      {/* Net Worth & Cashflow Card */}
      <NetWorthCard
        netWorth={netWorth}
        monthlyIncome={monthlyIncome}
        monthlyExpense={monthlyExpense}
        netCashflow={netCashflow}
      />

      {/* Wallets Row */}
      <WalletList
        wallets={wallets}
        onAddWallet={() => setIsWalletModalOpen(true)}
      />

      {/* Category Expense Breakdown (Top 4) */}
      {categoryBreakdown.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#81A1C1]">
              Pengeluaran Berdasarkan Kategori
            </h3>
            <Link
              href="/reports"
              className="text-xs font-semibold text-[#88C0D0] hover:text-[#ECEFF4] flex items-center gap-0.5 tap-effect transition-colors"
            >
              Detail <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ExpenseCategoryBreakdown
            categories={categoryBreakdown.slice(0, 4)}
            totalExpense={monthlyExpense}
          />
        </div>
      )}

      {/* Recent Transactions List */}
      <RecentTransactions
        transactions={recentTransactions}
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
      />

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSuccess={() => triggerRefresh()}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTxForEdit(null);
        }}
        transaction={selectedTxForEdit as any}
        onSuccess={() => triggerRefresh()}
      />
    </div>
  );
}
