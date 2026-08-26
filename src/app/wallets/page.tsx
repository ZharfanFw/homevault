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
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Saldo Semua Dompet
          </span>
          <h2 className="text-2xl font-extrabold text-white font-mono mt-1">
            {formatCurrency(totalNetWorth)}
          </h2>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tap-effect shadow-lg shadow-blue-500/25 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Dompet Baru
        </button>
      </div>

      {/* Active Wallets Section */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Dompet Aktif ({activeWallets.length})
        </h3>
        <div className="space-y-3">
          {activeWallets.map((wallet) => (
            <div
              key={wallet.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                  style={{ backgroundColor: wallet.color }}
                >
                  <CategoryIcon name={wallet.icon} className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">
                      {wallet.name}
                    </h4>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {wallet.type}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-white font-mono mt-0.5 truncate">
                    {formatCurrency(wallet.currentBalance)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => handleEdit(wallet)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 tap-effect"
                  aria-label="Edit Dompet"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleArchive(wallet)}
                  className="p-2 text-slate-400 hover:text-amber-400 rounded-xl hover:bg-slate-800 tap-effect"
                  aria-label="Arsipkan Dompet"
                  title="Arsipkan"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(wallet.id, wallet.name)}
                  className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 tap-effect"
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
            Dompet Diarsipkan ({archivedWallets.length})
          </h3>
          <div className="space-y-3 opacity-60">
            {archivedWallets.map((wallet) => (
              <div
                key={wallet.id}
                className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: wallet.color }}
                  >
                    <CategoryIcon name={wallet.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white truncate">
                      {wallet.name}
                    </h4>
                    <p className="text-xs font-mono text-slate-400">
                      {formatCurrency(wallet.currentBalance)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleArchive(wallet)}
                    className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl tap-effect"
                    title="Pulihkan Dompet"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(wallet.id, wallet.name)}
                    className="p-2 text-slate-400 hover:text-red-400 rounded-xl tap-effect"
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
