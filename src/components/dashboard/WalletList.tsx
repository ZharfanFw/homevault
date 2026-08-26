"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils/format";
import { CategoryIcon } from "@/lib/utils/icons";
import { Plus, ChevronRight } from "lucide-react";
import Link from "next/link";

export interface WalletItem {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
  currentBalance: number;
  isArchived: boolean;
}

interface WalletListProps {
  wallets: WalletItem[];
  onAddWallet?: () => void;
}

export function WalletList({ wallets, onAddWallet }: WalletListProps) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Dompet & Rekening
        </h3>
        <Link
          href="/wallets"
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-0.5 tap-effect"
        >
          Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 px-1">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="shrink-0 w-44 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: wallet.color }}
              >
                <CategoryIcon name={wallet.icon} className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {wallet.type}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 truncate">
                {wallet.name}
              </p>
              <p className="text-sm font-bold text-white font-mono mt-0.5 truncate">
                {formatCurrency(wallet.currentBalance)}
              </p>
            </div>
          </div>
        ))}

        {onAddWallet && (
          <button
            onClick={onAddWallet}
            className="shrink-0 w-32 p-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/30 flex flex-col items-center justify-center gap-2 tap-effect text-slate-400 hover:text-white cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Tambah</span>
          </button>
        )}
      </div>
    </div>
  );
}
