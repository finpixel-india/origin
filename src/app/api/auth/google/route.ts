import { NextResponse } from "next/server";
import { googleConfigured, makeOAuthState, redirectUri, originFrom } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!googleConfigured()) {
    return NextResponse.redirect(`${originFrom(req)}/settings?auth=unconfigured`);
  }

  const state = makeOAuthState();
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "select_account",
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
