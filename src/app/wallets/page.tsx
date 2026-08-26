"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils/format";
import { CategoryIcon } from "@/lib/utils/icons";
import { Plus, Edit2, Archive, Trash2, ArchiveRestore } from "lucide-react";
import { WalletModal } from "@/components/modals/WalletModal";

interface WalletItem {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  color: string;
  icon: string;
  currentBalance: number;
  isArchived: boolean;
}

export default function WalletsPage() {
  const { refreshTrigger, triggerRefresh } = useApp();
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [totalNetWorth, setTotalNetWorth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletItem | null>(null);

  const fetchWallets = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/wallets?includeArchived=true");
      if (res.ok) {
        const data = await res.json();
        setWallets(data.wallets || []);
        setTotalNetWorth(data.totalNetWorth || 0);
      }
    } catch (e) {
      console.error("Fetch wallets error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets, refreshTrigger]);

  const handleEdit = (w: WalletItem) => {
    setSelectedWallet(w);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedWallet(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus dompet "${name}"? Seluruh transaksi terkait dompet ini akan ikut terhapus.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerRefresh();
      }
    } catch (e) {
      console.error("Delete wallet error:", e);
    }
  };

  const handleToggleArchive = async (w: WalletItem) => {
    try {
      const res = await fetch(`/api/wallets/${w.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !w.isArchived }),
      });
      if (res.ok) {
        triggerRefresh();
      }
    } catch (e) {
      console.error("Toggle archive error:", e);
    }
  };

  const activeWallets = wallets.filter((w) => !w.isArchived);
  const archivedWallets = wallets.filter((w) => w.isArchived);

  return (
    <div className="py-4 space-y-6">
      {/* Header Summary */}
      <div className="p-5 rounded-3xl bg-[#2E3440] border border-[#434C5E] shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#81A1C1] uppercase tracking-wider">
            Total Saldo Semua Dompet
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#ECEFF4] font-mono mt-1">
            {formatCurrency(totalNetWorth)}
          </h2>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] hover:brightness-110 text-[#2E3440] font-extrabold text-xs tap-effect shadow-lg shadow-[#88C0D0]/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.8]" /> Dompet Baru
        </button>
      </div>

      {/* Active Wallets Section */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#81A1C1] mb-3 px-1">
          Dompet Aktif ({activeWallets.length})
        </h3>
        <div className="space-y-3">
          {activeWallets.map((wallet) => (
            <div
              key={wallet.id}
              className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm flex items-center justify-between group hover:border-[#81A1C1] transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#2E3440] shadow-md shrink-0 ring-1 ring-white/10"
                  style={{ backgroundColor: wallet.color }}
                >
                  <CategoryIcon name={wallet.icon} className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#ECEFF4] truncate">
                      {wallet.name}
                    </h4>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#3B4252] text-[#D8DEE9] border border-[#434C5E]">
                      {wallet.type}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-[#ECEFF4] font-mono mt-0.5 truncate">
                    {formatCurrency(wallet.currentBalance)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => handleEdit(wallet)}
                  className="p-2 text-[#D8DEE9]/60 hover:text-[#ECEFF4] rounded-xl hover:bg-[#3B4252] tap-effect"
                  aria-label="Edit Dompet"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleArchive(wallet)}
                  className="p-2 text-[#D8DEE9]/60 hover:text-[#EBCB8B] rounded-xl hover:bg-[#3B4252] tap-effect"
                  aria-label="Arsipkan Dompet"
                  title="Arsipkan"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(wallet.id, wallet.name)}
                  className="p-2 text-[#D8DEE9]/60 hover:text-[#BF616A] rounded-xl hover:bg-[#3B4252] tap-effect"
                  aria-label="Hapus Dompet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Archived Wallets Section */}
      {archivedWallets.length > 0 && (
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#4C566A] mb-3 px-1">
            Dompet Diarsipkan ({archivedWallets.length})
          </h3>
          <div className="space-y-3 opacity-60">
            {archivedWallets.map((wallet) => (
              <div
                key={wallet.id}
                className="p-3.5 rounded-2xl bg-[#2E3440]/60 border border-[#434C5E]/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[#2E3440] shrink-0"
                    style={{ backgroundColor: wallet.color }}
                  >
                    <CategoryIcon name={wallet.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#ECEFF4] truncate">
                      {wallet.name}
                    </h4>
                    <p className="text-xs font-mono text-[#D8DEE9]/70">
                      {formatCurrency(wallet.currentBalance)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleArchive(wallet)}
                    className="p-2 text-[#D8DEE9] hover:text-[#A3BE8C] rounded-xl tap-effect"
                    title="Pulihkan Dompet"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(wallet.id, wallet.name)}
                    className="p-2 text-[#D8DEE9] hover:text-[#BF616A] rounded-xl tap-effect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        wallet={selectedWallet}
        onSuccess={() => triggerRefresh()}
      />
    </div>
  );
}
