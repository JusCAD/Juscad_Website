import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createOAuthConsentToken } from "@/lib/mailing";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ legalAccepted: z.literal(true), marketingOptIn: z.boolean().default(false) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Accept the Terms and Privacy Policy first." }, { status: 400 });
  if (!process.env.RATE_LIMIT_SALT) return NextResponse.json({ error: "Consent signing is not configured." }, { status: 503 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Authentication is not configured yet." }, { status: 503 });
  const origin = new URL(request.url).origin;
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback` } });
  if (error || !data.url) return NextResponse.json({ error: error?.message ?? "Google sign-in could not start." }, { status: 400 });
  (await cookies()).set("juscad_oauth_consent", createOAuthConsentToken(parsed.data.marketingOptIn), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/auth/callback", maxAge: 900 });
  return NextResponse.json({ url: data.url });
}
