import { NextResponse } from "next/server";
import { db } from "@/db";
import { appData } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await db.select().from(appData).where(eq(appData.userId, user.id)).limit(1);
  const row = rows[0];
  return NextResponse.json({
    data: row?.data ?? null,
    updatedAt: row?.updatedAt ?? null,
  });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const payload = body as { data?: unknown };
  if (!payload || typeof payload.data !== "object" || payload.data === null) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const now = new Date();
  await db
    .insert(appData)
    .values({ userId: user.id, data: payload.data as object, updatedAt: now })
    .onConflictDoUpdate({
      target: appData.userId,
      set: { data: payload.data as object, updatedAt: now },
    });

  return NextResponse.json({ ok: true, updatedAt: now });
}
