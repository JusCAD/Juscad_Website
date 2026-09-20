"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { track } from "@vercel/analytics";

type Mode = "sign-in" | "sign-up" | "forgot" | "reset";

export function AuthForm({ mode, next = "/settings", initialError }: { mode: Mode; next?: string; initialError?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!isSupabaseConfigured) {
      setError("Authentication is not configured yet.");
      setLoading(false);
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();
    const supabase = createClient();

    try {
      if (showEmail && !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
      if (showPassword && password.length < 8) throw new Error("Use at least 8 characters.");
      if (mode === "sign-up" && fullName.length < 2) throw new Error("Enter your name.");
      if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        track("sign_in_completed", { method: "email" });
        router.push(next.startsWith("/") ? next : "/settings");
        router.refresh();
      } else if (mode === "sign-up") {
        if (!legalAccepted) throw new Error("Accept the Terms and Privacy Policy to create an account.");
        const response = await fetch("/api/auth/sign-up", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, fullName, legalAccepted, marketingOptIn }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error ?? "Account creation failed.");
        track("account_created", { method: "email" });
        setMessage("Check your inbox to verify your email, then sign in.");
      } else if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (authError) throw authError;
        setMessage("If an account exists for that address, a reset link is on its way.");
      } else {
        if (password.length < 8) throw new Error("Use at least 8 characters.");
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setMessage("Password updated. You can now continue to settings.");
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    if (!isSupabaseConfigured) {
      setError("Authentication is not configured yet.");
      setLoading(false);
      return;
    }
    track("sign_in_started", { method: "google" });
    if (mode === "sign-up") {
      if (!legalAccepted) {
        setError("Accept the Terms and Privacy Policy to create an account.");
        setLoading(false);
        return;
      }
      const response = await fetch("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ legalAccepted, marketingOptIn }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) {
        setError(result.error ?? "Google sign-in could not start.");
        setLoading(false);
        return;
      }
      window.location.assign(result.url);
      return;
    }
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  const showEmail = mode !== "reset";
  const showPassword = mode !== "forgot";

  return (
    <div>
      {(mode === "sign-in" || mode === "sign-up") && (
        <>
          <button type="button" onClick={signInWithGoogle} disabled={loading || (mode === "sign-up" && !legalAccepted)} className="btn btn-secondary w-full">
            Continue with Google
          </button>
          <div className="my-6 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-line" /><span className="type-tech-sm text-muted">OR</span><span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        {mode === "sign-up" && (
          <div className="field">
            <label className="field-label" htmlFor="auth-name">Name</label>
            <input id="auth-name" name="fullName" autoComplete="name" className="field-input" minLength={2} maxLength={100} required />
          </div>
        )}
        {showEmail && (
          <div className="field">
            <label className="field-label" htmlFor="auth-email">Email</label>
            <input id="auth-email" name="email" type="email" autoComplete="email" className="field-input" required />
          </div>
        )}
        {showPassword && (
          <div className="field">
            <label className="field-label" htmlFor="auth-password">{mode === "reset" ? "New password" : "Password"}</label>
            <input id="auth-password" name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} className="field-input" minLength={8} required />
          </div>
        )}
        {mode === "sign-up" && (
          <fieldset className="flex flex-col gap-4">
            <legend className="sr-only">Registration consent</legend>
            <label className="consent-row">
              <input type="checkbox" checked={legalAccepted} onChange={(event) => setLegalAccepted(event.target.checked)} required />
              <span>I agree to the <Link href="/terms" target="_blank">Terms and Conditions</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>. <strong>Required</strong></span>
            </label>
            <label className="consent-row">
              <input type="checkbox" checked={marketingOptIn} onChange={(event) => setMarketingOptIn(event.target.checked)} />
              <span>Send me occasional JusCAD product updates. I can unsubscribe at any time. <em>Optional</em></span>
            </label>
          </fieldset>
        )}
        {error && <p className="status status-error" role="alert">{error}</p>}
        {message && <p className="status status-ok" role="status">{message}</p>}
        <button className="btn btn-primary w-full" disabled={loading || (mode === "sign-up" && !legalAccepted)} type="submit">
          {loading ? "Working…" : mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}
        </button>
      </form>
      <div className="mt-6 flex flex-wrap justify-between gap-3 type-tech-sm text-muted">
        {mode === "sign-in" && <><Link href="/forgot-password">Forgot password?</Link><Link href="/sign-up">Create account</Link></>}
        {mode === "sign-up" && <Link href="/sign-in">Already have an account?</Link>}
        {(mode === "forgot" || mode === "reset") && <Link href="/sign-in">Back to sign in</Link>}
      </div>
    </div>
  );
}
