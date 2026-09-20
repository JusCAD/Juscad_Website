import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { deleteAccount, signOut, subscribeToUpdates, unsubscribeFromUpdates, updateAccount } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Settings — JusCAD", robots: { index: false, follow: false } };

const NOTICES: Record<string, string> = {
  saved: "Profile updated.",
  "verify-email": "Check your new address to confirm the email change.",
  "invalid-profile": "Enter a valid name and email address.",
  "update-failed": "We could not update your profile.",
  "email-failed": "Your name was saved, but the email change could not be started.",
  "admin-required": "That area is available to administrators only.",
  "admin-delete-blocked": "Transfer or archive authored posts before deleting an administrator account.",
  "delete-confirmation": "Enter your complete email address to confirm deletion.",
  "delete-failed": "Account deletion failed. Contact enquire@juscad.com.",
  "not-configured": "This service is not configured yet.",
  "mailing-subscribed": "You are subscribed to JusCAD product updates.",
  "mailing-unsubscribed": "You have been unsubscribed from product updates.",
  "mailing-failed": "We could not update your email preference. Please try again.",
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const viewer = await requireUser();
  const admin = createAdminClient();
  const { data: mailing } = admin ? await admin.from("mailing_subscriptions").select("status").eq("user_id", viewer.user.id).maybeSingle() : { data: null };
  const { notice } = await searchParams;
  return (
    <main className="relative z-10 min-h-[100dvh] bg-canvas pt-28 pb-24 md:pt-36">
      <div className="container-jc">
        <header className="mb-12 max-w-3xl">
          <p className="eyebrow mb-7"><span>Account</span><span>{viewer.role}</span></p>
          <h1 className="type-section text-fg mb-5">Settings</h1>
          <p className="type-body text-muted">Manage your identity and see which JusCAD services are available to you.</p>
        </header>
        {notice && NOTICES[notice] && <p className="status mb-8 border border-line bg-surface px-4 py-3" role="status">{NOTICES[notice]}</p>}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel p-6 md:p-8">
            <p className="type-tech text-muted mb-6">Profile</p>
            <form action={updateAccount} className="flex flex-col gap-5">
              <div className="field"><label htmlFor="displayName" className="field-label">Name</label><input id="displayName" name="displayName" className="field-input" defaultValue={viewer.displayName ?? ""} minLength={2} maxLength={100} required /></div>
              <div className="field"><label htmlFor="email" className="field-label">Email</label><input id="email" name="email" type="email" className="field-input" defaultValue={viewer.user.email ?? ""} required /></div>
              <button className="btn btn-primary self-start" type="submit">Save profile</button>
            </form>
          </section>

          <section className="panel p-6 md:p-8">
            <p className="type-tech text-muted mb-6">Access status</p>
            <dl className="divide-y divide-line">
              {[["Plan", "Early Access"], ["Credits", "Not yet metered"], ["Usage", "Not available yet"], ["Billing", "Not enabled"]].map(([term, value]) => <div key={term} className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0"><dt className="text-muted">{term}</dt><dd className="font-[550] text-fg text-right">{value}</dd></div>)}
            </dl>
            <Link href="/download" className="btn btn-secondary mt-8">View downloads</Link>
            {viewer.role === "admin" && <Link href="/admin/blog" className="btn btn-secondary mt-3 ml-3">Blog admin</Link>}
          </section>

          <section className="panel p-6 md:p-8">
            <p className="type-tech text-muted mb-3">Security</p>
            <p className="type-body text-muted mb-6">Signing out clears this browser session.</p>
            <form action={signOut}><button type="submit" className="btn btn-secondary">Sign out</button></form>
          </section>

          <section className="panel p-6 md:p-8">
            <p className="type-tech text-muted mb-3">Email updates</p>
            <p className="type-body text-muted mb-2">Occasional product and beta news from JusCAD.</p>
            <p className="field-help mb-6">Status: {mailing?.status === "subscribed" ? "Subscribed" : "Not subscribed"}</p>
            <form action={mailing?.status === "subscribed" ? unsubscribeFromUpdates : subscribeToUpdates}>
              <button type="submit" className="btn btn-secondary">{mailing?.status === "subscribed" ? "Unsubscribe" : "Subscribe"}</button>
            </form>
          </section>

          <section className="panel p-6 md:p-8 border-danger/40">
            <p className="type-tech text-danger mb-3">Delete account</p>
            <p className="type-body text-muted mb-6">This permanently removes your account and profile. Form submissions may be retained according to the Privacy Policy.</p>
            <form action={deleteAccount} className="flex flex-col gap-4">
              <div className="field"><label htmlFor="confirmation" className="field-label">Enter {viewer.user.email} to confirm</label><input id="confirmation" name="confirmation" type="email" className="field-input" autoComplete="off" required disabled={viewer.role === "admin"} /></div>
              <button type="submit" className="btn btn-secondary self-start" disabled={viewer.role === "admin"}>Delete account</button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
