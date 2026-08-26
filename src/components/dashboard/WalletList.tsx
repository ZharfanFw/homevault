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
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#81A1C1]">
          Dompet & Rekening
        </h3>
        <Link
          href="/wallets"
          className="text-xs font-semibold text-[#88C0D0] hover:text-[#ECEFF4] flex items-center gap-0.5 tap-effect transition-colors"
        >
          Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 px-1">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="shrink-0 w-44 p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-lg flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#2E3440] shadow-sm ring-1 ring-white/20"
                style={{ backgroundColor: wallet.color }}
              >
                <CategoryIcon name={wallet.icon} className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3B4252] text-[#D8DEE9] border border-[#434C5E]">
                {wallet.type}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-[#D8DEE9] truncate">
                {wallet.name}
              </p>
              <p className="text-sm font-extrabold text-[#ECEFF4] font-mono mt-0.5 truncate">
                {formatCurrency(wallet.currentBalance)}
              </p>
            </div>
          </div>
        ))}

        {onAddWallet && (
          <button
            onClick={onAddWallet}
            className="shrink-0 w-32 p-4 rounded-2xl border-2 border-dashed border-[#434C5E] hover:border-[#88C0D0] bg-[#2E3440]/40 flex flex-col items-center justify-center gap-2 tap-effect text-[#D8DEE9] hover:text-[#88C0D0] cursor-pointer transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-[#3B4252] flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Tambah</span>
          </button>
        )}
      </div>
    </div>
  );
}
