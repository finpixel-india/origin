import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, normalizeUsername, verifyPassword } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const username = normalizeUsername(body.username ?? "");
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json({ error: "Enter your ID and password." }, { status: 400 });
  }

  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const user = rows[0];

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Wrong ID or password." }, { status: 401 });
  }

  await createSession(user.id);

  return NextResponse.json({
    user: { id: user.id, username: user.username, name: user.name },
  });
}
