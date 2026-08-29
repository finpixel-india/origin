import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, hashPassword, normalizeUsername } from "@/lib/server/auth";

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

  if (username.length < 3) {
    return NextResponse.json({ error: "ID must be at least 3 characters." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing[0]) {
    return NextResponse.json({ error: "That ID is already taken." }, { status: 409 });
  }

  const inserted = await db
    .insert(users)
    .values({
      username,
      passwordHash: hashPassword(password),
      name: body.username?.trim() || username,
    })
    .returning({ id: users.id, username: users.username, name: users.name });

  const user = inserted[0];
  await createSession(user.id);

  return NextResponse.json({
    user: { id: user.id, username: user.username, name: user.name },
  });
}
