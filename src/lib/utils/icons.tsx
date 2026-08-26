import React from "react";
import {
  Utensils,
  ShoppingCart,
  Car,
  Receipt,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Briefcase,
  Gift,
  TrendingUp,
  Laptop,
  PiggyBank,
  Banknote,
  Building2,
  CreditCard,
  Wallet,
  Smartphone,
  Coffee,
  Plane,
  Home,
  Film,
  Zap,
  ShoppingBag,
  Heart,
  Book,
  Shield,
  Smile,
  LucideProps,
} from "lucide-react";

export const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  utensils: Utensils,
  "shopping-cart": ShoppingCart,
  "shopping-bag": ShoppingBag,
  car: Car,
  receipt: Receipt,
  "gamepad-2": Gamepad2,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  "more-horizontal": MoreHorizontal,
  briefcase: Briefcase,
  gift: Gift,
  "trending-up": TrendingUp,
  laptop: Laptop,
  "piggy-bank": PiggyBank,
  banknote: Banknote,
  "building-2": Building2,
  "credit-card": CreditCard,
  wallet: Wallet,
  smartphone: Smartphone,
  coffee: Coffee,
  plane: Plane,
  home: Home,
  film: Film,
  zap: Zap,
  heart: Heart,
  book: Book,
  shield: Shield,
  smile: Smile,
};

export const COLOR_PALETTE = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f97316", // Orange
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#84cc16", // Lime
  "#64748b", // Slate
];

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export function CategoryIcon({
  name,
  className = "w-5 h-5",
}: {
  name?: string;
  className?: string;
}) {
  const IconComponent = (name && ICON_MAP[name]) || Wallet;
  return <IconComponent className={className} />;
}
