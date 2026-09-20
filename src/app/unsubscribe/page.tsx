import type { Metadata } from "next";
import Link from "next/link";
import { readUnsubscribeToken } from "@/lib/mailing";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmUnsubscribe } from "./actions";

export const metadata: Metadata = { title: "Email preferences — JusCAD", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string; status?: string }> }) {
  const { token = "", status } = await searchParams;
  const payload = readUnsubscribeToken(token);
  const admin = createAdminClient();
  const { data: subscription } = payload && admin ? await admin.from("mailing_subscriptions").select("email, status, token_version").eq("id", payload.id).maybeSingle() : { data: null };
  const valid = Boolean(payload && subscription && subscription.token_version === payload.version);
  const title = status === "done" ? "You are unsubscribed." : status === "failed" ? "We could not update your preference." : !valid ? "This link is no longer valid." : "Unsubscribe from JusCAD updates?";
  return (
    <main className="relative z-10 grid min-h-[100dvh] place-items-center bg-canvas px-5 py-28">
      <section className="panel w-full max-w-xl p-7 md:p-10">
        <p className="type-tech text-muted mb-6">Email preferences</p>
        <h1 className="type-small text-fg mb-4">{title}</h1>
        {valid && !status && subscription?.status === "subscribed" ? <><p className="type-body text-muted mb-8">This stops marketing and product-update messages to {subscription.email}. Account and security emails are unaffected.</p><form action={confirmUnsubscribe}><input type="hidden" name="token" value={token} /><button className="btn btn-primary" type="submit">Confirm unsubscribe</button></form></> : <p className="type-body text-muted mb-8">{status === "failed" ? "Please try again later or contact enquire@juscad.com." : "No further action is needed."}</p>}
        <Link href="/" className="btn btn-secondary mt-3">Return to JusCAD</Link>
      </section>
    </main>
  );
}
