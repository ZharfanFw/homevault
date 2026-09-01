"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { refreshUser, registrationAllowed } = useApp();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Semua bidang wajib diisi.");
      return;
    }

    if (mode === "register" && !name) {
      setError("Nama wajib diisi untuk pendaftaran.");
      return;
    }

    setIsLoading(true);
    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email, password }
          : { name, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal melakukan autentikasi.");
      } else {
        await refreshUser();
        window.location.href = "/";
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden bg-[#242933]">
      {/* Nord Aurora & Frost background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#88C0D0]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[#5E81AC]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm z-10">
        {/* App Logo & Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#5E81AC] via-[#81A1C1] to-[#88C0D0] mx-auto flex items-center justify-center shadow-xl shadow-[#88C0D0]/20 mb-3 ring-1 ring-white/20">
            <Wallet className="w-8 h-8 text-[#2E3440] stroke-[2.4]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#ECEFF4] tracking-tight">
            HomeVault
          </h1>
          <p className="text-xs font-medium text-[#81A1C1] mt-1 tracking-wide">
            Self-Hosted Family Finance Tracker
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card rounded-3xl p-6 shadow-2xl border border-[#434C5E]">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#242933] rounded-2xl mb-5 border border-[#434C5E]">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`py-2 text-xs font-bold rounded-xl tap-effect transition-all ${mode === "login"
                  ? "bg-[#88C0D0] text-[#2E3440] shadow-sm"
                  : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
                }`}
            >
              Masuk
            </button>
            <button
              type="button"
              disabled={!registrationAllowed}
              onClick={() => {
                if (registrationAllowed) {
                  setMode("register");
                  setError("");
                }
              }}
              className={`py-2 text-xs font-bold rounded-xl tap-effect transition-all ${mode === "register"
                  ? "bg-[#88C0D0] text-[#2E3440] shadow-sm"
                  : !registrationAllowed
                    ? "text-[#4C566A] cursor-not-allowed"
                    : "text-[#D8DEE9]/70 hover:text-[#ECEFF4]"
                }`}
            >
              Daftar Baru
            </button>
          </div>

          {!registrationAllowed && mode === "register" && (
            <div className="mb-4 p-3 bg-[#EBCB8B]/15 border border-[#EBCB8B]/30 text-[#EBCB8B] text-xs rounded-xl font-medium">
              Pendaftaran anggota baru dinonaktifkan oleh administrator.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-[#BF616A]/15 border border-[#BF616A]/30 text-[#BF616A] text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <div>
                <label className="text-[11px] font-semibold text-[#D8DEE9] block mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#81A1C1] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Contoh: Zharfan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#242933] border border-[#434C5E] rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none placeholder-[#4C566A]"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-[#D8DEE9] block mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#81A1C1] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#242933] border border-[#434C5E] rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none placeholder-[#4C566A]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#D8DEE9] block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#81A1C1] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#242933] border border-[#434C5E] rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#ECEFF4] focus:ring-2 focus:ring-[#88C0D0] focus:outline-none placeholder-[#4C566A]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#5E81AC] to-[#88C0D0] hover:brightness-110 text-[#2E3440] font-extrabold text-xs shadow-lg shadow-[#88C0D0]/25 tap-effect flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#2E3440]/30 border-t-[#2E3440] rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Masuk ke Akun" : "Daftar Sekarang"}
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security / Privacy Badge */}
        <div className="mt-6 text-center">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#81A1C1]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#A3BE8C]" />
            100% Self-Hosted & Private Multi-User
          </p>
        </div>
      </div>
    </div>
  );
}
