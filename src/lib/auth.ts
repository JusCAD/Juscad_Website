import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database";

export async function getViewer() {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    displayName: profile?.display_name ?? user.user_metadata?.full_name ?? null,
    role: (profile?.role ?? "user") as AppRole,
    onboardingCompletedAt: profile?.onboarding_completed_at ?? null,
  };
}

export async function redirectAuthenticatedUser() {
  const viewer = await getViewer();
  if (viewer) redirect("/settings");
}

export async function requireUser() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?next=/settings");
  return viewer;
}

export async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?next=/admin/blog");
  if (viewer.role !== "admin") redirect("/settings?notice=admin-required");
  return viewer;
}
