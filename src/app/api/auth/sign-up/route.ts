import { NextResponse } from "next/server";
import { z } from "zod";
import { LEGAL_METADATA } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
  legalAccepted: z.literal(true),
  marketingOptIn: z.boolean().default(false),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Accept the Terms and Privacy Policy and check your details." }, { status: 400 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Authentication is not configured yet." }, { status: 503 });
  const origin = new URL(request.url).origin;
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName, marketing_opt_in: parsed.data.marketingOptIn, ...LEGAL_METADATA }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
