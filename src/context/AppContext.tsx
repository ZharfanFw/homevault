"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  isAdmin: boolean;
}

interface AppContextType {
  user: User | null;
  isLoadingUser: boolean;
  registrationAllowed: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (m: number) => void;
  setSelectedYear: (y: number) => void;
  isQuickAddOpen: boolean;
  quickAddDefaultType: "EXPENSE" | "INCOME" | "TRANSFER";
  openQuickAdd: (type?: "EXPENSE" | "INCOME" | "TRANSFER") => void;
  closeQuickAdd: () => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [registrationAllowed, setRegistrationAllowed] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDefaultType, setQuickAddDefaultType] = useState<
    "EXPENSE" | "INCOME" | "TRANSFER"
  >("EXPENSE");

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRegistrationAllowed(data.registrationAllowed);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/auth");
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const openQuickAdd = (type: "EXPENSE" | "INCOME" | "TRANSFER" = "EXPENSE") => {
    setQuickAddDefaultType(type);
    setIsQuickAddOpen(true);
  };

  const closeQuickAdd = () => {
    setIsQuickAddOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isLoadingUser,
        registrationAllowed,
        refreshUser,
        logout,
        selectedMonth,
        selectedYear,
        setSelectedMonth,
        setSelectedYear,
        isQuickAddOpen,
        quickAddDefaultType,
        openQuickAdd,
        closeQuickAdd,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
