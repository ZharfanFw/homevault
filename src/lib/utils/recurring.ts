/**
 * Helper utilities for recurring transaction dates and frequency calculations
 */

export function calculateNextDueDate(
  currentDueDate: string,
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
): string {
  const [year, month, day] = currentDueDate.split("-").map((n) => parseInt(n, 10));
  const date = new Date(year, month - 1, day);

  switch (frequency) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY": {
      const targetMonth = date.getMonth() + 1;
      date.setMonth(targetMonth);
      // Handle month end clipping (e.g. Jan 31 -> Feb 28)
      if (date.getMonth() !== targetMonth % 12) {
        date.setDate(0);
      }
      break;
    }
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDaysRemaining(targetDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = targetDateStr.split("-").map((n) => parseInt(n, 10));
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDueDateBadge(daysRemaining: number): {
  label: string;
  badgeClass: string;
  isOverdue: boolean;
  isDueSoon: boolean;
} {
  if (daysRemaining < 0) {
    return {
      label: `Terlambat ${Math.abs(daysRemaining)} hari`,
      badgeClass: "bg-[#BF616A]/20 text-[#BF616A] border-[#BF616A]/30",
      isOverdue: true,
      isDueSoon: false,
    };
  }
  if (daysRemaining === 0) {
    return {
      label: "Jatuh tempo Hari Ini!",
      badgeClass: "bg-[#EBCB8B]/20 text-[#EBCB8B] border-[#EBCB8B]/30 animate-pulse",
      isOverdue: false,
      isDueSoon: true,
    };
  }
  if (daysRemaining === 1) {
    return {
      label: "Besok",
      badgeClass: "bg-[#EBCB8B]/20 text-[#EBCB8B] border-[#EBCB8B]/30",
      isOverdue: false,
      isDueSoon: true,
    };
  }
  if (daysRemaining <= 7) {
    return {
      label: `${daysRemaining} hari lagi`,
      badgeClass: "bg-[#88C0D0]/20 text-[#88C0D0] border-[#88C0D0]/30",
      isOverdue: false,
      isDueSoon: true,
    };
  }
  return {
    label: `${daysRemaining} hari lagi`,
    badgeClass: "bg-[#434C5E]/50 text-[#D8DEE9] border-[#434C5E]",
    isOverdue: false,
    isDueSoon: false,
  };
}
