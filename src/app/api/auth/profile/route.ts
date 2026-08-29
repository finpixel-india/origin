import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Allow updating picture and/or name
    const updates: any = {};
    if (typeof body.picture === "string") updates.picture = body.picture;
    if (typeof body.name === "string") updates.name = body.name;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
