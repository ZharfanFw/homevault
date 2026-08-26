import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, transactions, wallets, categories } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allTx = db
      .select({
        id: transactions.id,
        date: transactions.date,
        type: transactions.type,
        amount: transactions.amount,
        notes: transactions.notes,
        walletName: wallets.name,
        categoryName: categories.name,
        destinationWalletId: transactions.destinationWalletId,
      })
      .from(transactions)
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .all();

    // Map destination wallets
    const allWallets = db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, user.id))
      .all();
    const walletMap = allWallets.reduce((acc, w) => {
      acc[w.id] = w.name;
      return acc;
    }, {} as Record<string, string>);

    // Build CSV Header & Rows
    const headers = [
      "Tanggal",
      "Tipe",
      "Nominal (Rp)",
      "Dompet Asal",
      "Kategori",
      "Dompet Tujuan",
      "Catatan",
    ];

    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return '""';
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = allTx.map((tx) => {
      const typeLabel =
        tx.type === "EXPENSE"
          ? "Pengeluaran"
          : tx.type === "INCOME"
          ? "Pemasukan"
          : "Transfer";

      const destWallet = tx.destinationWalletId
        ? walletMap[tx.destinationWalletId] || ""
        : "";

      return [
        escapeCsv(tx.date),
        escapeCsv(typeLabel),
        tx.amount.toString(),
        escapeCsv(tx.walletName || ""),
        escapeCsv(tx.categoryName || "-"),
        escapeCsv(destWallet),
        escapeCsv(tx.notes || ""),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n"); // Prepend UTF-8 BOM

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transaksi-keuangan-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export CSV error:", error);
    return NextResponse.json(
      { error: "Gagal mengunduh file CSV." },
      { status: 500 }
    );
  }
}
