import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { applyForBeta, skipBeta } from "./actions";

export const metadata: Metadata = { title: "Welcome — JusCAD", robots: { index: false, follow: false } };

export default async function WelcomePage() {
  const viewer = await requireUser();
  if (viewer.onboardingCompletedAt) redirect("/settings");
  return (
    <main className="relative z-10 grid min-h-[100dvh] place-items-center bg-canvas px-5 py-28">
      <section className="panel w-full max-w-2xl p-7 md:p-12" aria-labelledby="welcome-title">
        <p className="eyebrow mb-8"><span>Account ready</span><span>Next step</span></p>
        <h1 id="welcome-title" className="type-section text-fg mb-6">Help shape the first JusCAD release.</h1>
        <p className="type-body text-muted max-w-[55ch] mb-10">Would you like to apply for the early-access beta? The short application helps us build a focused first cohort. Your name and email will already be filled in.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <form action={applyForBeta}><button className="btn btn-primary w-full sm:w-auto" type="submit">Apply for beta</button></form>
          <form action={skipBeta}><button className="btn btn-secondary w-full sm:w-auto" type="submit">Not now</button></form>
        </div>
        <p className="field-help mt-6">This choice does not subscribe you to marketing messages.</p>
      </section>
    </main>
  );
}
