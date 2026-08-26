"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { QuickAddModal } from "../modals/QuickAddModal";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoadingUser } = useApp();

  const isAuthPage = pathname === "/auth";

  React.useEffect(() => {
    if (!isLoadingUser && !user && !isAuthPage) {
      router.push("/auth");
    }
  }, [isLoadingUser, user, isAuthPage, router]);

  // If loading session
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-400 mt-4 tracking-wider uppercase">
          Finance Tracker
        </p>
      </div>
    );
  }

  // If not logged in and not on /auth page, return null while useEffect redirects
  if (!user && !isAuthPage) {
    return null;
  }

  // If on /auth page
  if (isAuthPage) {
    return <main className="min-h-screen bg-slate-950">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-blue-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 pb-nav">
        {children}
      </main>

      <BottomNav />
      <QuickAddModal />
    </div>
  );
}
