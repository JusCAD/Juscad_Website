import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";
import { readOAuthConsentToken, subscribeToMailingList } from "@/lib/mailing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") ?? "/settings";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/settings";
  if (code) {
    const supabase = await createClient();
    const { error } = supabase ? await supabase.auth.exchangeCodeForSession(code) : { error: new Error("Supabase is not configured") };
    if (!error && supabase) {
      if (next === "/reset-password") return NextResponse.redirect(new URL(next, url.origin));
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const admin = createAdminClient();
        const cookieStore = await cookies();
        const consent = readOAuthConsentToken(cookieStore.get("juscad_oauth_consent")?.value ?? "");
        cookieStore.delete("juscad_oauth_consent");
        if (admin && consent) {
          const acceptedAt = new Date().toISOString();
          await admin.from("profiles").update({ terms_accepted_at: acceptedAt, terms_version: TERMS_VERSION, privacy_accepted_at: acceptedAt, privacy_version: PRIVACY_VERSION }).eq("id", user.id);
          if (consent.marketing && user.email) await subscribeToMailingList({ email: user.email, userId: user.id, source: "signup", name: user.user_metadata?.full_name });
        }
        const { data: profile } = admin ? await admin.from("profiles").select("onboarding_completed_at, terms_accepted_at, privacy_accepted_at").eq("id", user.id).maybeSingle() : { data: null };
        if (admin && profile && !profile.onboarding_completed_at && !profile.terms_accepted_at && !profile.privacy_accepted_at && !consent) {
          await admin.auth.admin.deleteUser(user.id);
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL("/sign-up?error=legal-required", url.origin));
        }
        if (admin && profile && !profile.onboarding_completed_at && !consent && user.user_metadata?.marketing_opt_in === true && user.email) {
          await subscribeToMailingList({ email: user.email, userId: user.id, source: "signup", name: user.user_metadata?.full_name });
        }
        if (profile && !profile.onboarding_completed_at) return NextResponse.redirect(new URL("/welcome", url.origin));
      }
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/sign-in?error=callback", url.origin));
}
