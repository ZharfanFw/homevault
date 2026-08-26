"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { formatCurrency, getMonthName } from "@/lib/utils/format";
import { CategoryIcon } from "@/lib/utils/icons";
import { CategoryModal } from "@/components/modals/CategoryModal";
import { BudgetModal } from "@/components/modals/BudgetModal";
import {
  ShieldCheck,
  Download,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  type: "EXPENSE" | "INCOME";
  icon: string;
  color: string;
}

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amountLimit: number;
  spent: number;
  remaining: number;
  percentage: number;
}

interface AdminData {
  allowRegistration: boolean;
  totalUsers: number;
  users: Array<{
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    createdAt: string;
  }>;
}

export default function SettingsPage() {
  const {
    user,
    logout,
    selectedMonth,
    selectedYear,
    refreshTrigger,
    triggerRefresh,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    "profile" | "categories" | "budgets" | "admin"
  >("profile");

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [adminData, setAdminData] = useState<AdminData | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(
    null
  );
  const [categoryDefaultType, setCategoryDefaultType] = useState<
    "EXPENSE" | "INCOME"
  >("EXPENSE");

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetItem | null>(null);

  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [catsRes, budgetsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`),
      ]);

      if (catsRes.ok) {
        const cData = await catsRes.json();
        setCategories(cData.categories || []);
      }

      if (budgetsRes.ok) {
        const bData = await budgetsRes.json();
        setBudgets(bData.budgets || []);
      }

      if (user?.isAdmin) {
        const adminRes = await fetch("/api/admin/settings");
        if (adminRes.ok) {
          const aData = await adminRes.json();
          setAdminData(aData);
        }
      }
    } catch (e) {
      console.error("Settings load data error:", e);
    }
  }, [selectedMonth, selectedYear, user?.isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) triggerRefresh();
    } catch (e) {
      console.error("Delete category error:", e);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Hapus target anggaran ini?")) return;
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (res.ok) triggerRefresh();
    } catch (e) {
      console.error("Delete budget error:", e);
    }
  };

  const handleToggleRegistration = async () => {
    if (!adminData) return;
    setIsUpdatingAdmin(true);
    try {
      const newAllowed = !adminData.allowRegistration;
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowRegistration: newAllowed }),
      });
      if (res.ok) {
        setAdminData({ ...adminData, allowRegistration: newAllowed });
      }
    } catch (e) {
      console.error("Admin toggle error:", e);
    } finally {
      setIsUpdatingAdmin(false);
    }
  };

  const handleExportCsv = () => {
    window.location.href = "/api/export/csv";
  };

  return (
    <div className="py-4 space-y-5">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#ECEFF4] tracking-tight">
          Pengaturan
        </h2>
        <p className="text-xs text-[#81A1C1] mt-0.5 font-medium">
          Kelola profil, kategori, anggaran, dan data
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 p-1 bg-[#2E3440] border border-[#434C5E] rounded-2xl">
        <button
          onClick={() => setActiveTab("profile")}
          className={`py-2 text-xs font-bold rounded-xl tap-effect transition-all ${
            activeTab === "profile"
              ? "bg-[#88C0D0] text-[#2E3440] shadow-sm"
              : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
          }`}
        >
          Profil & Data
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`py-2 text-xs font-bold rounded-xl tap-effect transition-all ${
            activeTab === "categories"
              ? "bg-[#88C0D0] text-[#2E3440] shadow-sm"
              : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
          }`}
        >
          Kategori
        </button>
        <button
          onClick={() => setActiveTab("budgets")}
          className={`py-2 text-xs font-bold rounded-xl tap-effect transition-all ${
            activeTab === "budgets"
              ? "bg-[#88C0D0] text-[#2E3440] shadow-sm"
              : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
          }`}
        >
          Anggaran
        </button>
        {user?.isAdmin && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`py-2 text-xs font-bold rounded-xl tap-effect transition-all ${
              activeTab === "admin"
                ? "bg-[#88C0D0] text-[#2E3440] shadow-sm"
                : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
            }`}
          >
            Admin
          </button>
        )}
      </div>

      {/* Profile & Data Tab */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          {/* User Card */}
          <div className="p-5 rounded-3xl bg-[#2E3440] border border-[#434C5E] shadow-md">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5E81AC] to-[#88C0D0] flex items-center justify-center font-bold text-[#2E3440] text-xl shadow-lg shadow-[#88C0D0]/20 ring-1 ring-white/20">
                {user?.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#ECEFF4]">
                    {user?.name}
                  </h3>
                  {user?.isAdmin && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#88C0D0]/15 text-[#88C0D0] border border-[#88C0D0]/30">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#D8DEE9]/80 mt-0.5">{user?.email}</p>
                <p className="text-[11px] text-[#81A1C1] font-medium mt-0.5">
                  Mata Uang: {user?.currency || "IDR"}
                </p>
              </div>
            </div>
          </div>

          {/* Export CSV Card */}
          <div className="p-5 rounded-3xl bg-[#2E3440] border border-[#434C5E] shadow-sm flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#ECEFF4] uppercase tracking-wider">
                Ekspor Data Transaksi
              </h4>
              <p className="text-xs text-[#D8DEE9]/70 mt-0.5">
                Unduh seluruh riwayat dalam format CSV (Excel)
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#3B4252] hover:bg-[#434C5E] text-[#ECEFF4] border border-[#434C5E] text-xs font-bold tap-effect cursor-pointer"
            >
              <Download className="w-4 h-4" /> Unduh CSV
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#BF616A]/15 hover:bg-[#BF616A]/25 text-[#BF616A] border border-[#BF616A]/30 text-xs font-bold tap-effect flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <LogOut className="w-4 h-4" /> Keluar dari Akun
          </button>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#81A1C1]">
              Kategori Pengeluaran & Pemasukan
            </h3>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setCategoryDefaultType("EXPENSE");
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-extrabold tap-effect cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.8]" /> Tambah
            </button>
          </div>

          {/* Expense Categories */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#BF616A] mb-2 px-1">
              Pengeluaran
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories
                .filter((c) => c.type === "EXPENSE")
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-2xl bg-[#2E3440] border border-[#434C5E] flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[#2E3440] shrink-0 shadow-sm ring-1 ring-white/10"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-[#ECEFF4] truncate">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1.5 text-[#D8DEE9]/60 hover:text-[#ECEFF4] rounded-lg tap-effect"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 text-[#D8DEE9]/60 hover:text-[#BF616A] rounded-lg tap-effect"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Income Categories */}
          <div className="pt-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#A3BE8C] mb-2 px-1">
              Pemasukan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories
                .filter((c) => c.type === "INCOME")
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-2xl bg-[#2E3440] border border-[#434C5E] flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[#2E3440] shrink-0 shadow-sm ring-1 ring-white/10"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-[#ECEFF4] truncate">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1.5 text-[#D8DEE9]/60 hover:text-[#ECEFF4] rounded-lg tap-effect"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 text-[#D8DEE9]/60 hover:text-[#BF616A] rounded-lg tap-effect"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === "budgets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#81A1C1]">
                Target Anggaran Bulan {getMonthName(selectedMonth - 1)} {selectedYear}
              </h3>
              <p className="text-[11px] text-[#D8DEE9]/70 mt-0.5">
                Pantau batas pengeluaran per kategori
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedBudget(null);
                setIsBudgetModalOpen(true);
              }}
              className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] text-[#2E3440] text-xs font-extrabold tap-effect cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.8]" /> Set Target
            </button>
          </div>

          {budgets.length === 0 ? (
            <div className="p-8 text-center bg-[#2E3440]/60 border border-[#434C5E] rounded-3xl">
              <p className="text-xs text-[#D8DEE9]/60">
                Belum ada target anggaran untuk bulan ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.map((b) => {
                const statusColor =
                  b.percentage > 100
                    ? "text-[#BF616A]"
                    : b.percentage >= 75
                    ? "text-[#EBCB8B]"
                    : "text-[#A3BE8C]";

                const barColor =
                  b.percentage > 100
                    ? "bg-[#BF616A]"
                    : b.percentage >= 75
                    ? "bg-[#EBCB8B]"
                    : "bg-[#A3BE8C]";

                return (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-[#2E3440] border border-[#434C5E] shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-[#2E3440] shrink-0 shadow-sm ring-1 ring-white/10"
                          style={{ backgroundColor: b.categoryColor }}
                        >
                          <CategoryIcon name={b.categoryIcon} className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-[#ECEFF4] truncate">
                          {b.categoryName}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedBudget(b);
                            setIsBudgetModalOpen(true);
                          }}
                          className="p-1.5 text-[#D8DEE9]/60 hover:text-[#ECEFF4] rounded-lg tap-effect"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(b.id)}
                          className="p-1.5 text-[#D8DEE9]/60 hover:text-[#BF616A] rounded-lg tap-effect"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[#D8DEE9]/70 font-mono text-[11px]">
                        Terpakai:{" "}
                        <strong className="text-[#ECEFF4]">
                          {formatCurrency(b.spent)}
                        </strong>{" "}
                        / {formatCurrency(b.amountLimit)}
                      </span>
                      <span className={`font-extrabold font-mono text-xs ${statusColor}`}>
                        {b.percentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#242933] rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                        className={`h-full rounded-full transition-all ${barColor}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Admin Tab */}
      {activeTab === "admin" && user?.isAdmin && adminData && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#2E3440] border border-[#434C5E] shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#ECEFF4] uppercase tracking-wider">
                  Pendaftaran Anggota Baru
                </h4>
                <p className="text-xs text-[#D8DEE9]/70 mt-0.5">
                  {adminData.allowRegistration
                    ? "Registrasi publik saat ini terbuka."
                    : "Registrasi dikunci (hanya akun terdaftar yang bisa masuk)."}
                </p>
              </div>
              <button
                onClick={handleToggleRegistration}
                disabled={isUpdatingAdmin}
                className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold tap-effect transition-all cursor-pointer ${
                  adminData.allowRegistration
                    ? "bg-[#A3BE8C]/20 text-[#A3BE8C] border border-[#A3BE8C]/30"
                    : "bg-[#BF616A]/20 text-[#BF616A] border border-[#BF616A]/30"
                }`}
              >
                {adminData.allowRegistration ? (
                  <>
                    <Unlock className="w-4 h-4" /> Buka
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Kunci
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Registered Users List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#81A1C1] mb-3 px-1">
              Anggota Keluarga Terdaftar ({adminData.totalUsers})
            </h4>
            <div className="space-y-2">
              {adminData.users.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-2xl bg-[#2E3440] border border-[#434C5E] flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#3B4252] flex items-center justify-center font-bold text-[#88C0D0] text-xs">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#ECEFF4]">
                          {u.name}
                        </span>
                        {u.isAdmin && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#88C0D0]/20 text-[#88C0D0] font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#D8DEE9]/70">{u.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={selectedCategory}
        defaultType={categoryDefaultType}
        onSuccess={() => triggerRefresh()}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        month={selectedMonth}
        year={selectedYear}
        categories={categories}
        existingBudget={selectedBudget}
        onSuccess={() => triggerRefresh()}
      />
    </div>
  );
}
