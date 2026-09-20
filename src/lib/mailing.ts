import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MailingSubscription } from "@/types/database";

export type ConsentSource = "signup" | "beta" | "settings";

type SignedPayload = { purpose: "oauth-consent" | "unsubscribe"; exp: number; [key: string]: unknown };

function signingSecret() {
  return process.env.RATE_LIMIT_SALT ?? "";
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function signPayload(payload: SignedPayload) {
  const body = encode(JSON.stringify(payload));
  const signature = createHmac("sha256", signingSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyPayload<T extends SignedPayload>(token: string, purpose: T["purpose"]): T | null {
  const [body, supplied] = token.split(".");
  if (!body || !supplied || !signingSecret()) return null;
  const expected = createHmac("sha256", signingSecret()).update(body).digest();
  const actual = Buffer.from(supplied, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as T;
    return payload.purpose === purpose && payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}

export function createOAuthConsentToken(marketing: boolean) {
  return signPayload({ purpose: "oauth-consent", marketing, exp: Math.floor(Date.now() / 1000) + 15 * 60 });
}

export function readOAuthConsentToken(token: string) {
  return verifyPayload<SignedPayload & { purpose: "oauth-consent"; marketing: boolean }>(token, "oauth-consent");
}

export function createUnsubscribeToken(subscription: Pick<MailingSubscription, "id" | "token_version">, maxAgeDays = 30) {
  return signPayload({ purpose: "unsubscribe", id: subscription.id, version: subscription.token_version, exp: Math.floor(Date.now() / 1000) + maxAgeDays * 86400 });
}

export function readUnsubscribeToken(token: string) {
  return verifyPayload<SignedPayload & { purpose: "unsubscribe"; id: string; version: number }>(token, "unsubscribe");
}

async function syncResend(email: string, unsubscribed: boolean, name?: string | null) {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) throw new Error("Resend audience is not configured");
  const resend = new Resend(apiKey);
  const updated = await resend.contacts.update({ audienceId, email, unsubscribed });
  if (!updated.error) return updated.data?.id ?? null;
  if (unsubscribed) throw new Error(updated.error.message);
  const [firstName, ...remaining] = (name ?? "").trim().split(/\s+/);
  const created = await resend.contacts.create({ audienceId, email, unsubscribed: false, firstName: firstName || undefined, lastName: remaining.join(" ") || undefined });
  if (created.error) throw new Error(created.error.message);
  return created.data?.id ?? null;
}

export async function subscribeToMailingList({ email, userId, source, name }: { email: string; userId?: string | null; source: ConsentSource; name?: string | null }) {
  const admin = createAdminClient();
  if (!admin) return { ok: false as const, error: "Subscription service is not configured." };
  const normalized = email.trim().toLowerCase();
  const { data: byUser } = userId ? await admin.from("mailing_subscriptions").select("*").eq("user_id", userId).maybeSingle() : { data: null };
  const { data: byEmail } = byUser ? { data: null } : await admin.from("mailing_subscriptions").select("*").eq("email", normalized).maybeSingle();
  const existing = byUser ?? byEmail;
  const now = new Date().toISOString();
  const values = { email: normalized, user_id: userId ?? existing?.user_id ?? null, status: "subscribed" as const, consent_source: source, consented_at: now, unsubscribed_at: null, token_version: (existing?.token_version ?? 0) + 1, sync_error: null };
  const result = existing
    ? await admin.from("mailing_subscriptions").update(values).eq("id", existing.id).select("*").single()
    : await admin.from("mailing_subscriptions").insert(values).select("*").single();
  if (result.error || !result.data) return { ok: false as const, error: "We could not save your subscription preference." };
  try {
    const contactId = await syncResend(normalized, false, name);
    await admin.from("mailing_subscriptions").update({ resend_contact_id: contactId, resend_synced_at: now, sync_error: null }).eq("id", result.data.id);
  } catch (error) {
    await admin.from("mailing_subscriptions").update({ sync_error: error instanceof Error ? error.message : "Resend sync failed" }).eq("id", result.data.id);
  }
  return { ok: true as const, subscription: result.data };
}

export async function unsubscribeFromMailingList(subscription: MailingSubscription) {
  const admin = createAdminClient();
  if (!admin) return { ok: false as const };
  const now = new Date().toISOString();
  const { error } = await admin.from("mailing_subscriptions").update({ status: "unsubscribed", unsubscribed_at: now, token_version: subscription.token_version + 1, sync_error: null }).eq("id", subscription.id);
  if (error) return { ok: false as const };
  try {
    const contactId = await syncResend(subscription.email, true);
    await admin.from("mailing_subscriptions").update({ resend_contact_id: contactId, resend_synced_at: now, sync_error: null }).eq("id", subscription.id);
  } catch (syncError) {
    await admin.from("mailing_subscriptions").update({ sync_error: syncError instanceof Error ? syncError.message : "Resend sync failed" }).eq("id", subscription.id);
  }
  return { ok: true as const };
}

export function marketingUnsubscribeHeaders(subscription: Pick<MailingSubscription, "id" | "token_version">) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://juscad.com";
  const token = encodeURIComponent(createUnsubscribeToken(subscription));
  const url = `${siteUrl}/unsubscribe?token=${token}`;
  const oneClickUrl = `${siteUrl}/api/unsubscribe?token=${token}`;
  return { url, headers: { "List-Unsubscribe": `<${oneClickUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } };
}
