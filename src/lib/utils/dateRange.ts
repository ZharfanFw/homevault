/**
 * Date range calculation and formatting utilities
 * Uses local timezone to prevent off-by-one UTC day shift errors.
 */

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface DateRangePreset {
  key: string;
  label: string;
  getRange: () => { from: string; to: string };
}

export function getDateRangePresets(): DateRangePreset[] {
  return [
    {
      key: "TODAY",
      label: "Hari Ini",
      getRange: () => {
        const today = new Date();
        const dateStr = toLocalDateString(today);
        return { from: dateStr, to: dateStr };
      },
    },
    {
      key: "LAST_7_DAYS",
      label: "7 Hari Terakhir",
      getRange: () => {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - 6);
        return { from: toLocalDateString(from), to: toLocalDateString(to) };
      },
    },
    {
      key: "LAST_30_DAYS",
      label: "30 Hari Terakhir",
      getRange: () => {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - 29);
        return { from: toLocalDateString(from), to: toLocalDateString(to) };
      },
    },
    {
      key: "THIS_MONTH",
      label: "Bulan Ini",
      getRange: () => {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { from: toLocalDateString(from), to: toLocalDateString(to) };
      },
    },
    {
      key: "LAST_MONTH",
      label: "Bulan Lalu",
      getRange: () => {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const to = new Date(now.getFullYear(), now.getMonth(), 0);
        return { from: toLocalDateString(from), to: toLocalDateString(to) };
      },
    },
    {
      key: "PAY_CYCLE_25",
      label: "Siklus Gajian (25 s/d 24)",
      getRange: () => {
        const now = new Date();
        const currentDay = now.getDate();
        let fromYear = now.getFullYear();
        let fromMonth = now.getMonth();
        let toYear = now.getFullYear();
        let toMonth = now.getMonth();

        if (currentDay >= 25) {
          // Dari tgl 25 bulan ini s/d 24 bulan depan
          fromMonth = now.getMonth();
          toMonth = now.getMonth() + 1;
          if (toMonth > 11) {
            toMonth = 0;
            toYear += 1;
          }
        } else {
          // Dari tgl 25 bulan lalu s/d 24 bulan ini
          fromMonth = now.getMonth() - 1;
          if (fromMonth < 0) {
            fromMonth = 11;
            fromYear -= 1;
          }
          toMonth = now.getMonth();
        }

        const from = new Date(fromYear, fromMonth, 25);
        const to = new Date(toYear, toMonth, 24);
        return { from: toLocalDateString(from), to: toLocalDateString(to) };
      },
    },
  ];
}

export function formatDateRangeLabel(fromStr: string, toStr: string): string {
  if (!fromStr || !toStr) return "";

  const [y1, m1, d1] = fromStr.split("-").map((n) => parseInt(n, 10));
  const [y2, m2, d2] = toStr.split("-").map((n) => parseInt(n, 10));

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

  if (fromStr === toStr) {
    return `${d1} ${months[m1 - 1]} ${y1}`;
  }

  if (y1 === y2 && m1 === m2) {
    return `${d1} – ${d2} ${months[m1 - 1]} ${y1}`;
  }

  if (y1 === y2) {
    return `${d1} ${months[m1 - 1]} – ${d2} ${months[m2 - 1]} ${y1}`;
  }

  return `${d1} ${months[m1 - 1]} ${y1} – ${d2} ${months[m2 - 1]} ${y2}`;
}
