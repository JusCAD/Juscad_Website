import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { redirectAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account — JusCAD", robots: { index: false, follow: false } };
export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await redirectAuthenticatedUser();
  const { error } = await searchParams;
  const initialError = error === "legal-required" ? "Accept the Terms and Privacy Policy before creating a new account with Google." : undefined;
  return <AuthShell eyebrow="Early access" title="Create your JusCAD account." description="Your account is the foundation for product access as the platform becomes available."><AuthForm mode="sign-up" initialError={initialError} /></AuthShell>;
}
