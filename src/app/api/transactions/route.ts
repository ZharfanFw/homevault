import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, transactions, wallets, categories } from "@/lib/db";
import { eq, and, desc, like, gte, lte, sql } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // "1" - "12"
    const year = searchParams.get("year"); // "2026"
    const walletId = searchParams.get("walletId");
    const categoryId = searchParams.get("categoryId");
    const type = searchParams.get("type"); // EXPENSE, INCOME, TRANSFER
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build conditions
    const conditions = [eq(transactions.userId, user.id)];

    if (year && month) {
      const paddedMonth = month.toString().padStart(2, "0");
      const startDateStr = `${year}-${paddedMonth}-01`;
      // Calculate end of month
      const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
      const endDateStr = `${year}-${paddedMonth}-${lastDay.toString().padStart(2, "0")}`;

      conditions.push(gte(transactions.date, startDateStr));
      conditions.push(lte(transactions.date, endDateStr));
    } else if (year) {
      conditions.push(gte(transactions.date, `${year}-01-01`));
      conditions.push(lte(transactions.date, `${year}-12-31`));
    }

    if (walletId) {
      conditions.push(
        sql`(${transactions.walletId} = ${walletId} OR ${transactions.destinationWalletId} = ${walletId})`
      );
    }

    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId));
    }

    if (type) {
      conditions.push(eq(transactions.type, type as "EXPENSE" | "INCOME" | "TRANSFER"));
    }

    if (search && search.trim()) {
      conditions.push(like(transactions.notes, `%${search.trim()}%`));
    }

    const query = db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        walletId: transactions.walletId,
        destinationWalletId: transactions.destinationWalletId,
        categoryId: transactions.categoryId,
        type: transactions.type,
        amount: transactions.amount,
        date: transactions.date,
        notes: transactions.notes,
        createdAt: transactions.createdAt,
        walletName: wallets.name,
        walletColor: wallets.color,
        walletIcon: wallets.icon,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
      })
      .from(transactions)
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    const results = query.all();

    // Also enrich destination wallet details for transfers
    const destinationWalletIds = results
      .filter((t) => t.type === "TRANSFER" && t.destinationWalletId)
      .map((t) => t.destinationWalletId as string);

    let destinationWalletsMap: Record<
      string,
      { name: string; color: string; icon: string }
    > = {};

    if (destinationWalletIds.length > 0) {
      const destWallets = db
        .select()
        .from(wallets)
        .where(
          and(
            eq(wallets.userId, user.id),
            sql`${wallets.id} IN (${sql.join(
              destinationWalletIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
        )
        .all();

      destinationWalletsMap = destWallets.reduce((acc, w) => {
        acc[w.id] = { name: w.name, color: w.color, icon: w.icon };
        return acc;
      }, {} as Record<string, { name: string; color: string; icon: string }>);
    }

    const enrichedResults = results.map((t) => {
      const destWallet = t.destinationWalletId
        ? destinationWalletsMap[t.destinationWalletId]
        : null;

      return {
        ...t,
        destinationWalletName: destWallet?.name || null,
        destinationWalletColor: destWallet?.color || null,
        destinationWalletIcon: destWallet?.icon || null,
      };
    });

    return NextResponse.json({ transactions: enrichedResults });
  } catch (error) {
    console.error("Fetch transactions error:", error);
    return NextResponse.json(
      { error: "Gagal memuat transaksi." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      walletId,
      destinationWalletId,
      categoryId,
      type,
      amount,
      date,
      notes,
    } = await req.json();

    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Jumlah nominal harus lebih dari 0." },
        { status: 400 }
      );
    }

    if (!walletId) {
      return NextResponse.json(
        { error: "Dompet wajib dipilih." },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Tanggal transaksi wajib diisi." },
        { status: 400 }
      );
    }

    if (type !== "EXPENSE" && type !== "INCOME" && type !== "TRANSFER") {
      return NextResponse.json(
        { error: "Tipe transaksi tidak valid." },
        { status: 400 }
      );
    }

    if (type === "TRANSFER") {
      if (!destinationWalletId) {
        return NextResponse.json(
          { error: "Dompet tujuan transfer wajib dipilih." },
          { status: 400 }
        );
      }
      if (walletId === destinationWalletId) {
        return NextResponse.json(
          { error: "Dompet asal dan dompet tujuan tidak boleh sama." },
          { status: 400 }
        );
      }
    } else {
      if (!categoryId) {
        return NextResponse.json(
          { error: "Kategori wajib dipilih." },
          { status: 400 }
        );
      }
    }

    const newTransaction = {
      id: crypto.randomUUID(),
      userId: user.id,
      walletId,
      destinationWalletId: type === "TRANSFER" ? destinationWalletId : null,
      categoryId: type === "TRANSFER" ? null : categoryId,
      type: type as "EXPENSE" | "INCOME" | "TRANSFER",
      amount: parsedAmount,
      date,
      notes: notes?.trim() || null,
      createdAt: new Date(),
    };

    db.insert(transactions).values(newTransaction).run();

    return NextResponse.json({ success: true, transaction: newTransaction });
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan transaksi." },
      { status: 500 }
    );
  }
}
