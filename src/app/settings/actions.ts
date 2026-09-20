"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { subscribeToMailingList, unsubscribeFromMailingList } from "@/lib/mailing";

const accountSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
});

export async function updateAccount(formData: FormData) {
  const viewer = await requireUser();
  const parsed = accountSchema.safeParse({ displayName: formData.get("displayName"), email: formData.get("email") });
  if (!parsed.success) redirect("/settings?notice=invalid-profile");
  const supabase = await createClient();
  if (!supabase) redirect("/settings?notice=not-configured");

  const { error: profileError } = await supabase.from("profiles").update({ display_name: parsed.data.displayName }).eq("id", viewer.user.id);
  if (profileError) redirect("/settings?notice=update-failed");

  if (parsed.data.email !== viewer.user.email) {
    const { error } = await supabase.auth.updateUser({ email: parsed.data.email });
    if (error) redirect("/settings?notice=email-failed");
    revalidatePath("/settings");
    redirect("/settings?notice=verify-email");
  }

  revalidatePath("/settings");
  redirect("/settings?notice=saved");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/sign-in");
}

export async function subscribeToUpdates() {
  const viewer = await requireUser();
  if (!viewer.user.email) redirect("/settings?notice=mailing-failed");
  const result = await subscribeToMailingList({ email: viewer.user.email, userId: viewer.user.id, source: "settings", name: viewer.displayName });
  revalidatePath("/settings");
  redirect(`/settings?notice=${result.ok ? "mailing-subscribed" : "mailing-failed"}`);
}

export async function unsubscribeFromUpdates() {
  const viewer = await requireUser();
  const admin = createAdminClient();
  if (!admin) redirect("/settings?notice=mailing-failed");
  const { data: subscription } = await admin.from("mailing_subscriptions").select("*").eq("user_id", viewer.user.id).maybeSingle();
  if (!subscription) redirect("/settings?notice=mailing-unsubscribed");
  const result = await unsubscribeFromMailingList(subscription);
  revalidatePath("/settings");
  redirect(`/settings?notice=${result.ok ? "mailing-unsubscribed" : "mailing-failed"}`);
}

export async function deleteAccount(formData: FormData) {
  const viewer = await requireUser();
  if (viewer.role === "admin") redirect("/settings?notice=admin-delete-blocked");
  const confirmation = String(formData.get("confirmation") ?? "").trim().toLowerCase();
  if (!viewer.user.email || confirmation !== viewer.user.email.toLowerCase()) redirect("/settings?notice=delete-confirmation");

  const admin = createAdminClient();
  if (!admin) redirect("/settings?notice=not-configured");
  const { error } = await admin.auth.admin.deleteUser(viewer.user.id);
  if (error) redirect("/settings?notice=delete-failed");
  redirect("/?account=deleted");
}
