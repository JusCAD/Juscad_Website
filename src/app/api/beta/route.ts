import { NextResponse } from "next/server";
import { Resend } from "resend";
import { betaWelcomeEmail, teamNotificationTemplate } from "@/lib/email-templates";
import { checkSubmissionSecurity } from "@/lib/forms/security";
import { betaApplicationSchema } from "@/lib/forms/schemas";
import { appendToSheet } from "@/lib/google-sheets";
import { getTimeStamp } from "@/lib/get-time-stamp";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { subscribeToMailingList } from "@/lib/mailing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = betaApplicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid submission." }, { status: 400 });
  const security = await checkSubmissionSecurity(request, parsed.data, "beta");
  if (!security.ok) return NextResponse.json({ error: security.error }, { status: security.status });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Submission service is not configured." }, { status: 503 });
  const body = parsed.data;
  const auth = await createClient();
  const { data: { user } } = auth ? await auth.auth.getUser() : { data: { user: null } };
  if (user) {
    const { data: duplicate } = await admin.from("beta_submissions").select("id").eq("user_id", user.id).maybeSingle();
    if (duplicate) return NextResponse.json({ error: "You already have a beta application." }, { status: 409 });
  }
  const { data: saved, error: saveError } = await admin.from("beta_submissions").insert({ name: body.name, email: body.email, user_id: user?.id ?? null, role: body.role || null, organization: body.organization || null, operating_system: body.operating_system || null, feature_requests: body.feature_requests || null, what_you_build: body.whatYouBuild || null, frustration: body.frustration || null }).select("id").single();
  if (saveError || !saved) return NextResponse.json({ error: "We could not save your application. Please try again." }, { status: 503 });

  let emailSent = false; let sheetSynced = false; const deliveryErrors: string[] = [];
  try {
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) throw new Error("Sheets not configured");
    await appendToSheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID, "Beta Users", { timestamp: getTimeStamp(), name: body.name, email: body.email, role: body.role, organization: body.organization, operating_system: body.operating_system, feature_requests: body.feature_requests, build_message: body.whatYouBuild, frustration_message: body.frustration });
    sheetSynced = true;
  } catch (error) { deliveryErrors.push(error instanceof Error ? error.message : "Sheets delivery failed"); }
  try {
    if (!process.env.RESEND_API_KEY) throw new Error("Email not configured");
    const resend = new Resend(process.env.RESEND_API_KEY); const recipient = process.env.JUSCAD_NOTIFICATION_EMAIL ?? "enquire@juscad.com";
    const team = await resend.emails.send({ from: "JusCAD <noreply@juscad.com>", to: recipient, replyTo: body.email, subject: `New beta signup — ${body.name}`, html: teamNotificationTemplate("Beta Signup", { Name: body.name, Email: body.email, Role: body.role || "—", Organization: body.organization || "—", "What they build": body.whatYouBuild || "—", "Biggest frustration": body.frustration || "—" }) });
    const confirmation = await resend.emails.send({ from: "JusCAD <noreply@juscad.com>", to: body.email, subject: "Welcome to the JusCAD beta", html: betaWelcomeEmail(body.name) });
    if (team.error || confirmation.error) throw new Error(team.error?.message ?? confirmation.error?.message ?? "Email delivery failed");
    emailSent = true;
  } catch (error) { deliveryErrors.push(error instanceof Error ? error.message : "Email delivery failed"); }
  await admin.from("beta_submissions").update({ email_sent_at: emailSent ? new Date().toISOString() : null, sheet_synced_at: sheetSynced ? new Date().toISOString() : null, delivery_error: deliveryErrors.join("; ") || null }).eq("id", (saved as { id: string }).id);
  if (body.marketingOptIn) await subscribeToMailingList({ email: body.email, userId: user?.id, source: "beta", name: body.name });
  return NextResponse.json({ success: true }, { status: 201 });
}
