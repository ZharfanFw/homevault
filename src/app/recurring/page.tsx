"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { CategoryIcon } from "@/lib/utils/icons";
import { formatDueDateBadge } from "@/lib/utils/recurring";
import { RecurringModal, RecurringItemData } from "@/components/modals/RecurringModal";
import {
  Plus,
  Repeat,
  Calendar,
  CheckCircle2,
  Pause,
  Play,
  Trash2,
  Edit2,
  AlertTriangle,
  Clock,
  Wallet as WalletIcon,
} from "lucide-react";

interface EnrichedRecurringItem extends RecurringItemData {
  id: string;
  walletName?: string | null;
  walletColor?: string | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  daysRemaining: number;
  isOverdue: boolean;
  logs: Array<{
    id: string;
    dueDate: string;
    paidDate?: string | null;
    status: string;
    amount: number;
  }>;
}

export default function RecurringPage() {
  const { refreshTrigger, triggerRefresh } = useApp();
  const [items, setItems] = useState<EnrichedRecurringItem[]>([]);
  const [wallets, setWallets] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"ALL" | "EXPENSE" | "INCOME" | "PAUSED">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EnrichedRecurringItem | null>(null);

  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [recurringRes, walletsRes, catRes] = await Promise.all([
        fetch("/api/recurring"),
        fetch("/api/wallets"),
        fetch("/api/categories"),
      ]);

      if (recurringRes.ok) {
        const data = await recurringRes.json();
        setItems(data.recurring || []);
      }
      if (walletsRes.ok) {
        const wData = await walletsRes.json();
        setWallets(wData.wallets || []);
      }
      if (catRes.ok) {
        const cData = await catRes.json();
        setCategories(cData.categories || []);
      }
    } catch (e) {
      console.error("Fetch recurring page data error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const handlePayNow = async (item: EnrichedRecurringItem) => {
    if (!confirm(`Konfirmasi pembayaran "${item.name}" sebesar ${formatCurrency(item.amount)}? Transaksi akan otomatis dicatat ke ${item.walletName || "dompet"}.`)) {
      return;
    }

    try {
      setPayingId(item.id);
      const res = await fetch(`/api/recurring/${item.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        triggerRefresh();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal memproses pembayaran.");
      }
    } catch (e) {
      console.error("Pay error:", e);
    } finally {
      setPayingId(null);
    }
  };

  const handleTogglePause = async (item: EnrichedRecurringItem) => {
    const newStatus = item.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch(`/api/recurring/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        triggerRefresh();
      }
    } catch (e) {
      console.error("Toggle pause error:", e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus aturan transaksi rutin "${name}"?`)) return;
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerRefresh();
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  // KPI calculations
  const totalMonthlyExpenses = items
    .filter((i) => i.type === "EXPENSE" && i.status === "ACTIVE")
    .reduce((sum, i) => {
      if (i.frequency === "MONTHLY") return sum + i.amount;
      if (i.frequency === "WEEKLY") return sum + i.amount * 4;
      if (i.frequency === "DAILY") return sum + i.amount * 30;
      if (i.frequency === "YEARLY") return sum + Math.round(i.amount / 12);
      return sum + i.amount;
    }, 0);

  const dueSoonCount = items.filter(
    (i) => i.status === "ACTIVE" && i.daysRemaining >= 0 && i.daysRemaining <= 7
  ).length;

  const overdueCount = items.filter(
    (i) => i.status === "ACTIVE" && i.daysRemaining < 0
  ).length;

  const filteredItems = items.filter((item) => {
    if (activeTab === "EXPENSE") return item.type === "EXPENSE" && item.status === "ACTIVE";
    if (activeTab === "INCOME") return item.type === "INCOME" && item.status === "ACTIVE";
    if (activeTab === "PAUSED") return item.status === "PAUSED";
    return true;
  });

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#ECEFF4] tracking-tight">
            Transaksi Berulang
          </h2>
          <p className="text-xs text-[#81A1C1] mt-0.5 font-medium">
            Langganan, tagihan rutin, & pemasukan terjadwal
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedItem(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-bold shadow-md shadow-[#88C0D0]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.8]" /> Tambah
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
          <div className="text-[10px] font-bold text-[#81A1C1] mb-1 flex items-center gap-1">
            <Repeat className="w-3 h-3 text-[#88C0D0]" /> Estimasi/Bulan
          </div>
          <p className="text-xs sm:text-sm font-extrabold font-mono text-[#ECEFF4] truncate">
            {formatCurrency(totalMonthlyExpenses)}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
          <div className="text-[10px] font-bold text-[#EBCB8B] mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Jatuh Tempo
          </div>
          <p className="text-xs sm:text-sm font-extrabold font-mono text-[#EBCB8B]">
            {dueSoonCount} Tagihan
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm">
          <div className="text-[10px] font-bold text-[#BF616A] mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Terlambat
          </div>
          <p className="text-xs sm:text-sm font-extrabold font-mono text-[#BF616A]">
            {overdueCount} Tagihan
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 bg-[#2E3440] border border-[#434C5E] rounded-xl text-xs">
        {[
          { key: "ALL", label: "Semua" },
          { key: "EXPENSE", label: "Tagihan" },
          { key: "INCOME", label: "Pemasukan" },
          { key: "PAUSED", label: "Dijeda" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
              activeTab === t.key
                ? "bg-[#3B4252] text-[#88C0D0] shadow-sm"
                : "text-[#D8DEE9]/60 hover:text-[#ECEFF4]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Item List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#88C0D0]/20 border-t-[#88C0D0] rounded-full animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-[#2E3440]/50 border border-[#434C5E]/50">
          <Repeat className="w-10 h-10 text-[#81A1C1]/40 mx-auto mb-2.5" />
          <p className="text-sm font-bold text-[#ECEFF4]">Belum Ada Transaksi Berulang</p>
          <p className="text-xs text-[#81A1C1] mt-1 max-w-xs mx-auto">
            Catat langganan streaming, tagihan internet, kos, atau gaji bulanan untuk otomatisasi pengingat.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const badge = formatDueDateBadge(item.daysRemaining);
            const freqLabel =
              item.frequency === "DAILY"
                ? "Harian"
                : item.frequency === "WEEKLY"
                ? "Mingguan"
                : item.frequency === "YEARLY"
                ? "Tahunan"
                : "Bulanan";

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] hover:border-[#81A1C1]/40 shadow-sm transition-all relative overflow-hidden"
              >
                {/* Top strip indicator */}
                <div
                  className={`h-1 w-full absolute top-0 left-0 ${
                    item.status === "PAUSED"
                      ? "bg-[#434C5E]"
                      : item.type === "EXPENSE"
                      ? "bg-[#BF616A]"
                      : "bg-[#A3BE8C]"
                  }`}
                />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[#2E3440] shrink-0 shadow"
                      style={{
                        backgroundColor: item.categoryColor || "#88C0D0",
                      }}
                    >
                      <CategoryIcon
                        name={item.categoryIcon || "repeat"}
                        className="w-5 h-5 stroke-[2.2]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#ECEFF4] leading-tight">
                          {item.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3B4252] text-[#81A1C1] border border-[#434C5E]">
                          {freqLabel}
                        </span>
                        {item.status === "PAUSED" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#434C5E]/50 text-[#D8DEE9]">
                            Dijeda
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#81A1C1] mt-1">
                        <span className="flex items-center gap-1">
                          <WalletIcon className="w-3 h-3" />
                          {item.walletName || "Dompet"}
                        </span>
                        {item.categoryName && (
                          <>
                            <span>•</span>
                            <span>{item.categoryName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm sm:text-base font-extrabold font-mono ${
                        item.type === "INCOME" ? "text-[#A3BE8C]" : "text-[#ECEFF4]"
                      }`}
                    >
                      {item.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(item.amount)}
                    </p>
                    {/* Due badge */}
                    {item.status === "ACTIVE" && (
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Next due date & actions footer */}
                <div className="mt-3.5 pt-3 border-t border-[#434C5E]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#81A1C1]">
                    <Calendar className="w-3.5 h-3.5 text-[#88C0D0]" />
                    <span>
                      Jatuh tempo:{" "}
                      <strong className="text-[#ECEFF4]">
                        {formatDate(item.nextDueDate)}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Pay Button */}
                    {item.status === "ACTIVE" && (
                      <button
                        onClick={() => handlePayNow(item)}
                        disabled={payingId === item.id}
                        className="px-2.5 py-1 rounded-lg bg-[#A3BE8C]/20 hover:bg-[#A3BE8C]/30 text-[#A3BE8C] border border-[#A3BE8C]/40 text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {payingId === item.id ? "Memproses..." : "Bayar & Catat"}
                      </button>
                    )}

                    {/* Pause/Resume button */}
                    <button
                      onClick={() => handleTogglePause(item)}
                      title={item.status === "ACTIVE" ? "Jeda aturan" : "Aktifkan aturan"}
                      className="p-1.5 rounded-lg text-[#81A1C1] hover:text-[#ECEFF4] hover:bg-[#3B4252] transition-colors"
                    >
                      {item.status === "ACTIVE" ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-[#A3BE8C]" />
                      )}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-[#81A1C1] hover:text-[#ECEFF4] hover:bg-[#3B4252] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 rounded-lg text-[#81A1C1] hover:text-[#BF616A] hover:bg-[#BF616A]/15 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingItem={selectedItem}
        wallets={wallets}
        categories={categories}
        onSuccess={triggerRefresh}
      />
    </div>
  );
}
