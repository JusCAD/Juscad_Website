import type { Metadata } from "next";
import BetaForm from "@/components/home/BetaForm";
import { getViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Beta Program — JusCAD",
  description:
    "Apply for early access to JusCAD. Help shape the future of cognitive engineering systems.",
};

export default async function BetaPage() {
  const viewer = await getViewer();
  const admin = viewer ? createAdminClient() : null;
  const { data: application } = admin ? await admin.from("beta_submissions").select("application_status").eq("user_id", viewer!.user.id).maybeSingle() : { data: null };
  return (
    <main className="relative z-10 min-h-[100dvh] pt-16 md:pt-[72px] bg-canvas">
      <BetaForm initialName={viewer?.displayName ?? ""} initialEmail={viewer?.user.email ?? ""} existingStatus={application?.application_status as string | undefined} />
    </main>
  );
}
