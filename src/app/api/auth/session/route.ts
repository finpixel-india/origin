import { NextResponse } from "next/server";
import { getCurrentUser, googleConfigured } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    configured: googleConfigured(),
    user: user
      ? {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          picture: user.picture,
        }
      : null,
  });
}
