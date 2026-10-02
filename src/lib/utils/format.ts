export function formatCurrency(
  amount: number,
  currency: string = "IDR",
  showSign: boolean = false
): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = "";
  if (currency === "IDR") {
    formatted = `Rp ${absAmount.toLocaleString("id-ID")}`;
  } else {
    formatted = `${currency} ${absAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}`;
  }

  if (showSign) {
    return isNegative ? `-${formatted}` : `+${formatted}`;
  }
  return isNegative ? `-${formatted}` : formatted;
}

export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return "Hari Ini";
  } else if (isYesterday) {
    return "Kemarin";
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatFullDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getMonthName(monthIndex: number): string {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return months[monthIndex] || "";
}

export function getShortMonthName(monthIndex: number): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return months[monthIndex] || "";
}

/**
 * Sanitizes numeric input string by stripping dots, commas, spaces, etc.
 * Handles inputs like "50.000", "50,000", "1.500.000", "50000".
 */
export function parseAmountInput(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  if (typeof input === "number") return isNaN(input) ? 0 : Math.max(0, Math.floor(input));
  if (typeof input !== "string") return 0;
  const cleaned = input.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

/**
 * Formats a raw number or numeric string to Indonesian thousand-separated string
 * e.g. 50000 -> "50.000"
 */
export function formatAmountInput(value: number | string | null | undefined): string {
  const num = parseAmountInput(value);
  if (!num) return "";
  return new Intl.NumberFormat("id-ID").format(num);
}

/**
 * Returns the local date string in YYYY-MM-DD format based on local client/system time,
 * avoiding the UTC offset shift caused by Date.prototype.toISOString().
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns formatted current day and date string in Indonesian locale
 * e.g. "Sabtu, 3 Oktober 2026" (long) or "Sabtu, 3 Okt 2026" (short)
 */
export function getTodayFormatted(mode: "long" | "short" = "long"): string {
  const d = new Date();
  if (mode === "short") {
    return d.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
