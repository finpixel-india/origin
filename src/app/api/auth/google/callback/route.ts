import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createSession,
  googleConfigured,
  originFrom,
  redirectUri,
  verifyOAuthState,
} from "@/lib/server/auth";

export const dynamic = "force-dynamic";

type GoogleTokens = { access_token?: string; error?: string };
type GoogleProfile = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
};

export async function GET(req: Request) {
  const origin = originFrom(req);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/settings?auth=error`);
  }
  if (!googleConfigured()) {
    return NextResponse.redirect(`${origin}/settings?auth=unconfigured`);
  }
  if (!verifyOAuthState(state)) {
    return NextResponse.redirect(`${origin}/settings?auth=error`);
  }

  try {
    // Exchange authorization code for tokens.
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: redirectUri(req),
        grant_type: "authorization_code",
      }),
    });
    const tokens = (await tokenRes.json()) as GoogleTokens;
    if (!tokens.access_token) {
      return NextResponse.redirect(`${origin}/settings?auth=error`);
    }

    // Fetch the user's profile.
    const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = (await profileRes.json()) as GoogleProfile;
    if (!profile.sub || !profile.email) {
      return NextResponse.redirect(`${origin}/settings?auth=error`);
    }

    // Upsert the user.
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.googleId, profile.sub))
      .limit(1);

    let userId: string;
    if (existing[0]) {
      userId = existing[0].id;
      await db
        .update(users)
        .set({
          email: profile.email,
          name: profile.name ?? null,
          picture: profile.picture ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      const inserted = await db
        .insert(users)
        .values({
          googleId: profile.sub,
          email: profile.email,
          name: profile.name ?? null,
          picture: profile.picture ?? null,
        })
        .returning({ id: users.id });
      userId = inserted[0].id;
    }

    await createSession(userId);
    return NextResponse.redirect(`${origin}/settings?auth=success`);
  } catch {
    return NextResponse.redirect(`${origin}/settings?auth=error`);
  }
}
