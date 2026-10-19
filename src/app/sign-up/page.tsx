import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { redirectAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account — JusCAD", robots: { index: false, follow: false } };
export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  await redirectAuthenticatedUser();
  const { next } = await searchParams;
  return <AuthShell eyebrow="Early access" title="Create your JusCAD account." description="Create an account to download JusCAD. Approval is automatic once you agree to join the beta."><AuthForm mode="sign-up" next={next} /></AuthShell>;
}
