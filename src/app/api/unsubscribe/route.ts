import { NextResponse } from "next/server";
import { readUnsubscribeToken, unsubscribeFromMailingList } from "@/lib/mailing";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const payload = readUnsubscribeToken(token);
  const admin = createAdminClient();
  if (!payload || !admin) return NextResponse.json({ error: "Invalid unsubscribe token." }, { status: 400 });
  const { data: subscription } = await admin.from("mailing_subscriptions").select("*").eq("id", payload.id).maybeSingle();
  if (!subscription || subscription.token_version !== payload.version) return NextResponse.json({ error: "Invalid unsubscribe token." }, { status: 400 });
  if (subscription.status !== "unsubscribed") await unsubscribeFromMailingList(subscription);
  return NextResponse.json({ success: true });
}
