import type { Metadata } from "next";
import { getViewer } from "@/lib/auth";
import { RELEASES } from "@/lib/releases";
import { DownloadOptions } from "./DownloadOptions";

export const metadata: Metadata = {
  title: "Downloads — JusCAD",
  description: "Download the JusCAD beta for macOS, Ubuntu, or Windows. Create an account to download. Approval is automatic.",
};

export default async function DownloadPage() {
  const viewer = await getViewer();

  return (
    <main className="relative z-10 min-h-[100dvh] bg-canvas pt-28 pb-24 md:pt-36">
      <div className="container-jc">
        <header className="mb-12 max-w-3xl">
          <p className="eyebrow mb-7">
            <span>Beta</span>
            <span>Live</span>
          </p>
          <h1 className="type-section text-fg mb-5">Download JusCAD</h1>
          <p className="type-lead text-muted">
            JusCAD runs inside FreeCAD. You can look at the builds here. Downloading requires an account, and a new account is approved automatically. Prompts and generated models are sent to the JusCAD cloud backend.
          </p>
        </header>
        <DownloadOptions releases={RELEASES} signedIn={Boolean(viewer)} />
      </div>
    </main>
  );
}
