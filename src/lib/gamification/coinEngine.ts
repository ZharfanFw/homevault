/**
 * Coin Engine for The Minted Goal Coins (Nordic Vault)
 * Handles tier calculation, peak milestone locking, next milestone targets, and visual metadata.
 */

export type CoinTier =
  | "raw_iron"
  | "bronze"
  | "sterling_silver"
  | "nordic_amber"
  | "nordic_crystal";

export interface CoinTierDetails {
  tier: CoinTier;
  name: string;
  nordicTitle: string;
  description: string;
  minPercentage: number;
  color: string;
  gradient: string;
  glowColor: string;
  borderColor: string;
  badge: string;
  symbol: string;
}

export const COIN_TIERS: Record<CoinTier, CoinTierDetails> = {
  raw_iron: {
    tier: "raw_iron",
    name: "Raw Iron",
    nordicTitle: "Jarn Smedja",
    description: "Besi tempa kasar di awal perjalanan menabung.",
    minPercentage: 0,
    color: "#4C566A",
    gradient: "from-[#3B4252] via-[#434C5E] to-[#4C566A]",
    glowColor: "rgba(76, 86, 106, 0.3)",
    borderColor: "#4C566A",
    badge: "Besi Tempa",
    symbol: "🔨",
  },
  bronze: {
    tier: "bronze",
    name: "Bronze Coin",
    nordicTitle: "Bronse Malm",
    description: "Milestone 25% tercapai! Fondasi tabungan mulai mengeras dan terbentuk kuat.",
    minPercentage: 25,
    color: "#D08770",
    gradient: "from-[#BF616A] via-[#D08770] to-[#EBCB8B]",
    glowColor: "rgba(208, 135, 112, 0.4)",
    borderColor: "#D08770",
    badge: "Perunggu Kuno",
    symbol: "🥉",
  },
  sterling_silver: {
    tier: "sterling_silver",
    name: "Sterling Silver",
    nordicTitle: "Solv Skatt",
    description: "Setengah jalan (50%)! Koin perak bersinar terang menempa masa depan.",
    minPercentage: 50,
    color: "#E5E9F0",
    gradient: "from-[#D8DEE9] via-[#E5E9F0] to-[#ECEFF4]",
    glowColor: "rgba(229, 233, 240, 0.45)",
    borderColor: "#E5E9F0",
    badge: "Perak Murni",
    symbol: "🥈",
  },
  nordic_amber: {
    tier: "nordic_amber",
    name: "Nordic Amber",
    nordicTitle: "Rav Lys",
    description: "Milestone 75%! Kilau emas amber menandakan garis akhir sudah di depan mata.",
    minPercentage: 75,
    color: "#EBCB8B",
    gradient: "from-[#D08770] via-[#EBCB8B] to-[#A3BE8C]",
    glowColor: "rgba(235, 203, 139, 0.5)",
    borderColor: "#EBCB8B",
    badge: "Amber Nordik",
    symbol: "🍯",
  },
  nordic_crystal: {
    tier: "nordic_crystal",
    name: "Nordic Crystal",
    nordicTitle: "Nordisk Krystall",
    description: "100% Target Tercapai! Mahakarya kristal biru es Nordik legendaris.",
    minPercentage: 100,
    color: "#88C0D0",
    gradient: "from-[#5E81AC] via-[#81A1C1] to-[#88C0D0]",
    glowColor: "rgba(136, 192, 208, 0.6)",
    borderColor: "#88C0D0",
    badge: "Kristal Nordik",
    symbol: "💎",
  },
};

/**
 * Determine coin tier based on peak milestone percentage (Peak Locking).
 * Even if user withdraws funds, the peak amount ensures the coin does not downgrade.
 */
export function getCoinTier(peakAmount: number, targetAmount: number): CoinTier {
  if (targetAmount <= 0) return "raw_iron";
  const percentage = (peakAmount / targetAmount) * 100;

  if (percentage >= 100) return "nordic_crystal";
  if (percentage >= 75) return "nordic_amber";
  if (percentage >= 50) return "sterling_silver";
  if (percentage >= 25) return "bronze";
  return "raw_iron";
}

export function getCoinTierDetails(tier: CoinTier): CoinTierDetails {
  return COIN_TIERS[tier] || COIN_TIERS.raw_iron;
}

export interface NextCoinMilestone {
  nextTier: CoinTier;
  nextTierName: string;
  nextTierPercentage: number;
  amountNeeded: number;
  percentageRemaining: number;
}

/**
 * Calculate the next coin tier milestone requirements.
 */
export function getNextCoinMilestone(
  currentAmount: number,
  targetAmount: number
): NextCoinMilestone | null {
  if (targetAmount <= 0) return null;
  const currentPercentage = (currentAmount / targetAmount) * 100;

  if (currentPercentage >= 100) {
    return null; // Already achieved the highest tier
  }

  let nextTargetPercentage = 25;
  let nextTier: CoinTier = "bronze";

  if (currentPercentage >= 75) {
    nextTargetPercentage = 100;
    nextTier = "nordic_crystal";
  } else if (currentPercentage >= 50) {
    nextTargetPercentage = 75;
    nextTier = "nordic_amber";
  } else if (currentPercentage >= 25) {
    nextTargetPercentage = 50;
    nextTier = "sterling_silver";
  }

  const nextTargetAmount = Math.ceil((nextTargetPercentage / 100) * targetAmount);
  const amountNeeded = Math.max(0, nextTargetAmount - currentAmount);
  const percentageRemaining = Math.max(
    0,
    parseFloat((nextTargetPercentage - currentPercentage).toFixed(1))
  );

  return {
    nextTier,
    nextTierName: COIN_TIERS[nextTier].name,
    nextTierPercentage: nextTargetPercentage,
    amountNeeded,
    percentageRemaining,
  };
}

/**
 * Enriches a savings goal database object with coin gamification metadata.
 */
export function enrichGoalWithCoin<
  T extends {
    targetAmount: number;
    currentAmount: number;
    peakAmount?: number | null;
    isFlawless?: boolean | null;
    completedAt?: Date | number | string | null;
  }
>(goal: T) {
  const currentAmount = goal.currentAmount || 0;
  const peakAmount = Math.max(goal.peakAmount || 0, currentAmount);
  const targetAmount = goal.targetAmount || 1;

  const currentPercentage =
    targetAmount > 0
      ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
      : 0;

  const peakPercentage =
    targetAmount > 0
      ? Math.min(100, Math.round((peakAmount / targetAmount) * 100))
      : 0;

  const tier = getCoinTier(peakAmount, targetAmount);
  const tierDetails = getCoinTierDetails(tier);
  const nextMilestone = getNextCoinMilestone(currentAmount, targetAmount);

  return {
    ...goal,
    peakAmount,
    currentPercentage,
    peakPercentage,
    coinTier: tier,
    coinDetails: tierDetails,
    nextMilestone,
    isFlawless: goal.isFlawless ?? true,
    completedAt: goal.completedAt ?? null,
  };
}
