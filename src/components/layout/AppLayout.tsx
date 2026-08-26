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
      <div className="min-h-screen bg-[#242933] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5E81AC] to-[#88C0D0] flex items-center justify-center shadow-lg shadow-[#88C0D0]/20 animate-pulse">
          <div className="w-6 h-6 border-2 border-[#2E3440]/30 border-t-[#2E3440] rounded-full animate-spin" />
        </div>
        <p className="text-xs font-bold text-[#81A1C1] mt-4 tracking-wider uppercase">
          HomeVault
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
    return <main className="min-h-screen bg-[#242933]">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-[#242933] text-[#ECEFF4] flex flex-col antialiased selection:bg-[#88C0D0] selection:text-[#2E3440]">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 pb-nav">
        {children}
      </main>

      <BottomNav />
      <QuickAddModal />
    </div>
  );
}
