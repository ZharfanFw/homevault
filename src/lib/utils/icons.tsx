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

// Nord Color Palette (Frost & Aurora)
export const COLOR_PALETTE = [
  "#88C0D0", // nord8 (Frost Ice Blue)
  "#81A1C1", // nord9 (Frost Glacier Blue)
  "#5E81AC", // nord10 (Frost Deep Arctic Blue)
  "#8FBCBB", // nord7 (Frost Teal)
  "#A3BE8C", // nord14 (Aurora Green)
  "#EBCB8B", // nord13 (Aurora Yellow)
  "#D08770", // nord12 (Aurora Orange)
  "#BF616A", // nord11 (Aurora Red)
  "#B48EAD", // nord15 (Aurora Purple)
  "#4C566A", // nord3 (Polar Dark Slate)
  "#D8DEE9", // nord4 (Snow Storm)
  "#3B4252", // nord1 (Polar Night)
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
