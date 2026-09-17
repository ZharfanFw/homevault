"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { DebtModal } from "@/components/modals/DebtModal";
import { DebtRepayModal } from "@/components/modals/DebtRepayModal";
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  User,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  CreditCard,
} from "lucide-react";

interface EnrichedDebtItem {
  id: string;
  type: "PAYABLE" | "RECEIVABLE";
  personName: string;
  totalAmount: number;
  remainingAmount: number;
  startDate: string;
  dueDate?: string | null;
  notes?: string | null;
  status?: "UNPAID" | "PARTIALLY_PAID" | "SETTLED";
  totalPaid: number;
  progressPercent: number;
  repayments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    notes?: string | null;
    walletName?: string | null;
    walletColor?: string | null;
  }>;
}

export default function DebtsPage() {
  const { refreshTrigger, triggerRefresh } = useApp();
  const [debts, setDebts] = useState<EnrichedDebtItem[]>([]);
  const [totalPayable, setTotalPayable] = useState(0);
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [wallets, setWallets] = useState<Array<{ id: string; name: string; currentBalance?: number; color: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"PAYABLE" | "RECEIVABLE">("PAYABLE");

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [selectedDebtForEdit, setSelectedDebtForEdit] = useState<EnrichedDebtItem | null>(null);

  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedDebtForRepay, setSelectedDebtForRepay] = useState<EnrichedDebtItem | null>(null);

  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [debtsRes, walletsRes] = await Promise.all([
        fetch("/api/debts"),
        fetch("/api/wallets"),
      ]);

      if (debtsRes.ok) {
        const dData = await debtsRes.json();
        setDebts(dData.debts || []);
        setTotalPayable(dData.totalPayable || 0);
        setTotalReceivable(dData.totalReceivable || 0);
        setNetBalance(dData.netBalance || 0);
      }
      if (walletsRes.ok) {
        const wData = await walletsRes.json();
        setWallets(wData.wallets || []);
      }
    } catch (e) {
      console.error("Fetch debts error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const handleDelete = async (id: string, person: string) => {
    if (!confirm(`Hapus catatan utang/piutang dengan "${person}"? Seluruh riwayat pembayaran juga akan dihapus.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerRefresh();
      }
    } catch (e) {
      console.error("Delete debt error:", e);
    }
  };

  const filteredDebts = debts.filter((d) => d.type === activeTab);

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#ECEFF4] tracking-tight">
            Utang & Piutang
          </h2>
          <p className="text-xs text-[#81A1C1] mt-0.5 font-medium">
            Pantau kewajiban dan penagihan pinjamanmu
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedDebtForEdit(null);
            setIsDebtModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-bold shadow-md shadow-[#88C0D0]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.8]" /> Catat Baru
        </button>
      </div>

      {/* Aggregate KPI Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
          <div className="text-[10px] font-bold text-[#BF616A] mb-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Utang Saya
          </div>
          <p className="text-xs sm:text-sm font-extrabold font-mono text-[#BF616A] truncate">
            {formatCurrency(totalPayable)}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
          <div className="text-[10px] font-bold text-[#A3BE8C] mb-1 flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3" /> Piutang Saya
          </div>
          <p className="text-xs sm:text-sm font-extrabold font-mono text-[#A3BE8C] truncate">
            {formatCurrency(totalReceivable)}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
          <div className="text-[10px] font-bold text-[#88C0D0] mb-1">
            Posisi Bersih
          </div>
          <p
            className={`text-xs sm:text-sm font-extrabold font-mono truncate ${
              netBalance >= 0 ? "text-[#A3BE8C]" : "text-[#BF616A]"
            }`}
          >
            {netBalance >= 0 ? "+" : ""}
            {formatCurrency(netBalance)}
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-[#2E3440] border border-[#434C5E] rounded-xl text-xs">
        <button
          onClick={() => setActiveTab("PAYABLE")}
          className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "PAYABLE"
              ? "bg-[#BF616A] text-[#ECEFF4] shadow-sm"
              : "text-[#D8DEE9]/60 hover:text-[#ECEFF4]"
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Utang Saya ({debts.filter((d) => d.type === "PAYABLE").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("RECEIVABLE")}
          className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "RECEIVABLE"
              ? "bg-[#88C0D0] text-[#2E3440] shadow-sm"
              : "text-[#D8DEE9]/60 hover:text-[#ECEFF4]"
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Piutang Saya ({debts.filter((d) => d.type === "RECEIVABLE").length})</span>
        </button>
      </div>

      {/* Debt List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#88C0D0]/20 border-t-[#88C0D0] rounded-full animate-spin" />
        </div>
      ) : filteredDebts.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-[#2E3440]/50 border border-[#434C5E]/50">
          <CreditCard className="w-10 h-10 text-[#81A1C1]/40 mx-auto mb-2.5" />
          <p className="text-sm font-bold text-[#ECEFF4]">
            {activeTab === "PAYABLE" ? "Tidak Ada Utang Aktif" : "Tidak Ada Piutang Aktif"}
          </p>
          <p className="text-xs text-[#81A1C1] mt-1 max-w-xs mx-auto">
            {activeTab === "PAYABLE"
              ? "Bagus sekali! Keuanganmu bebas dari beban utang."
              : "Belum ada catatan orang lain yang meminjam uang padamu."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDebts.map((item) => {
            const isSettled = item.status === "SETTLED" || (item.remainingAmount || 0) <= 0;
            const isExpanded = expandedDebtId === item.id;

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-[#2E3440] border border-[#434C5E] hover:border-[#81A1C1]/40 shadow-sm transition-all"
              >
                {/* Header card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow ${
                        item.type === "PAYABLE"
                          ? "bg-[#BF616A]/20 text-[#BF616A]"
                          : "bg-[#88C0D0]/20 text-[#88C0D0]"
                      }`}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-[#ECEFF4] leading-tight">
                          {item.personName}
                        </h4>
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A3BE8C]/20 text-[#A3BE8C] border border-[#A3BE8C]/40">
                            <CheckCircle className="w-3 h-3" /> Lunas
                          </span>
                        ) : item.status === "PARTIALLY_PAID" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBCB8B]/20 text-[#EBCB8B] border border-[#EBCB8B]/30">
                            Sebagian
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#BF616A]/20 text-[#BF616A] border border-[#BF616A]/30">
                            Belum Bayar
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#81A1C1] mt-0.5">
                        Mulai: {formatDate(item.startDate)}
                        {item.dueDate ? ` • Jatuh tempo: ${formatDate(item.dueDate)}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Top Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedDebtForEdit(item);
                        setIsDebtModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-[#81A1C1] hover:text-[#ECEFF4] hover:bg-[#3B4252] transition-colors"
                      title="Edit Data"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.personName)}
                      className="p-2 rounded-xl text-[#81A1C1] hover:text-[#BF616A] hover:bg-[#BF616A]/15 transition-colors"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Amount details */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-[#81A1C1]">Sisa Tagihan</span>
                    <p
                      className={`text-lg font-extrabold font-mono ${
                        isSettled
                          ? "text-[#A3BE8C]"
                          : item.type === "PAYABLE"
                          ? "text-[#BF616A]"
                          : "text-[#88C0D0]"
                      }`}
                    >
                      {formatCurrency(item.remainingAmount || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#81A1C1]">Total Pinjaman</span>
                    <p className="text-sm font-bold font-mono text-[#D8DEE9]">
                      {formatCurrency(item.totalAmount)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#242933] rounded-full h-2 mt-2 overflow-hidden p-0.5 border border-[#434C5E]/50">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isSettled
                        ? "bg-[#A3BE8C]"
                        : item.type === "PAYABLE"
                        ? "bg-[#BF616A]"
                        : "bg-[#88C0D0]"
                    }`}
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>

                {/* Notes */}
                {item.notes && (
                  <p className="mt-2.5 text-xs text-[#81A1C1] bg-[#242933]/50 p-2 rounded-xl border border-[#434C5E]/30">
                    Catatan: {item.notes}
                  </p>
                )}

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-[#434C5E]/60 flex items-center justify-between gap-2">
                  {!isSettled ? (
                    <button
                      onClick={() => {
                        setSelectedDebtForRepay(item);
                        setIsRepayModalOpen(true);
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow active:scale-95 ${
                        item.type === "PAYABLE"
                          ? "bg-[#BF616A] text-[#ECEFF4] hover:brightness-110 shadow-[#BF616A]/20"
                          : "bg-[#88C0D0] text-[#2E3440] hover:brightness-110 shadow-[#88C0D0]/20"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      {item.type === "PAYABLE" ? "Bayar Cicilan" : "Catat Pembayaran"}
                    </button>
                  ) : (
                    <div className="flex-1 text-xs font-bold text-[#A3BE8C] flex items-center gap-1 py-1">
                      <CheckCircle className="w-4 h-4" /> Telah Lunas Sepenuhnya
                    </div>
                  )}

                  <button
                    onClick={() =>
                      setExpandedDebtId(isExpanded ? null : item.id)
                    }
                    className="py-2 px-3 rounded-xl bg-[#3B4252] text-[#D8DEE9] hover:text-[#ECEFF4] text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Histori ({item.repayments.length})</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Repayment History Accordion */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-[#434C5E]/60 space-y-2 animate-fade-in">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#81A1C1]">
                      Riwayat Cicilan & Pelunasan
                    </h5>
                    {item.repayments.length === 0 ? (
                      <p className="text-xs text-[#81A1C1] italic py-2">
                        Belum ada pembayaran cicilan yang dicatat.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {item.repayments.map((rep) => (
                          <div
                            key={rep.id}
                            className="p-2.5 rounded-xl bg-[#242933] border border-[#434C5E]/50 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-[#ECEFF4] block">
                                {formatCurrency(rep.amount)}
                              </span>
                              <span className="text-[10px] text-[#81A1C1]">
                                {formatDate(rep.paymentDate)} • {rep.walletName || "Dompet"}
                                {rep.notes ? ` • ${rep.notes}` : ""}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-[#A3BE8C] bg-[#A3BE8C]/15 px-2 py-0.5 rounded-full border border-[#A3BE8C]/30">
                              Berhasil
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        existingDebt={selectedDebtForEdit}
        wallets={wallets}
        onSuccess={triggerRefresh}
      />

      <DebtRepayModal
        isOpen={isRepayModalOpen}
        onClose={() => setIsRepayModalOpen(false)}
        debt={selectedDebtForRepay}
        wallets={wallets}
        onSuccess={triggerRefresh}
      />
    </div>
  );
}
