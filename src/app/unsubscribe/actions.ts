"use server";

import { redirect } from "next/navigation";
import { readUnsubscribeToken, unsubscribeFromMailingList } from "@/lib/mailing";
import { createAdminClient } from "@/lib/supabase/admin";

export async function confirmUnsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const payload = readUnsubscribeToken(token);
  const admin = createAdminClient();
  if (!payload || !admin) redirect("/unsubscribe?status=invalid");
  const { data: subscription } = await admin.from("mailing_subscriptions").select("*").eq("id", payload.id).maybeSingle();
  if (!subscription || subscription.token_version !== payload.version) redirect("/unsubscribe?status=invalid");
  if (subscription.status === "unsubscribed") redirect("/unsubscribe?status=done");
  const result = await unsubscribeFromMailingList(subscription);
  redirect(`/unsubscribe?status=${result.ok ? "done" : "failed"}`);
}
