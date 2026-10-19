"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { track } from "@vercel/analytics";

type Mode = "sign-in" | "sign-up" | "forgot" | "reset";

const BETA_OPT_IN_KEY = "juscad-beta-opt-in";

function rememberBetaOptIn() {
  sessionStorage.setItem(BETA_OPT_IN_KEY, "1");
}

export function AuthForm({ mode, next = "/settings" }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [betaAgreed, setBetaAgreed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const needsBetaOptIn = mode === "sign-in" || mode === "sign-up";

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
      if (needsBetaOptIn && !betaAgreed) throw new Error("Agree to join the JusCAD beta to continue.");
      if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        rememberBetaOptIn();
        await supabase.auth.updateUser({ data: { beta_opt_in: true } });
        track("sign_in_completed", { method: "email" });
        router.push(next.startsWith("/") ? next : "/settings");
        router.refresh();
      } else if (mode === "sign-up") {
        rememberBetaOptIn();
        const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/settings";
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, beta_opt_in: true },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
          },
        });
        if (authError) throw authError;
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
    if (needsBetaOptIn && !betaAgreed) {
      setError("Agree to join the JusCAD beta to continue.");
      setLoading(false);
      return;
    }
    rememberBetaOptIn();
    const supabase = createClient();
    track("sign_in_started", { method: "google" });
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
      {needsBetaOptIn && (
        <label className="mb-6 flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            className="mt-1"
            checked={betaAgreed}
            onChange={(event) => setBetaAgreed(event.target.checked)}
            required
          />
          <span>I agree to join the JusCAD beta. A new account is approved automatically. Signing in alone does not join the beta.</span>
        </label>
      )}
      {(mode === "sign-in" || mode === "sign-up") && (
        <>
          <button type="button" onClick={signInWithGoogle} disabled={loading || !betaAgreed} className="btn btn-secondary w-full">
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
        {error && <p className="status status-error" role="alert">{error}</p>}
        {message && <p className="status status-ok" role="status">{message}</p>}
        <button className="btn btn-primary w-full" disabled={loading} type="submit">
          {loading ? "Working…" : mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}
        </button>
      </form>
      <div className="mt-6 flex flex-wrap justify-between gap-3 type-tech-sm text-muted">
        {mode === "sign-in" && <><Link href="/forgot-password">Forgot password?</Link><Link href={`/sign-up?next=${encodeURIComponent(next)}`}>Create account</Link></>}
        {mode === "sign-up" && <Link href="/sign-in">Already have an account?</Link>}
        {(mode === "forgot" || mode === "reset") && <Link href="/sign-in">Back to sign in</Link>}
      </div>
    </div>
  );
}
