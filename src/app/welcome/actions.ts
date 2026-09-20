"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function completeOnboarding() {
  const viewer = await requireUser();
  const admin = createAdminClient();
  if (admin) await admin.from("profiles").update({ onboarding_completed_at: new Date().toISOString() }).eq("id", viewer.user.id);
}

export async function applyForBeta() {
  await completeOnboarding();
  redirect("/beta");
}

export async function skipBeta() {
  await completeOnboarding();
  redirect("/settings");
}
