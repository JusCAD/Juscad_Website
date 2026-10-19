"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { AppleLogo, LinuxLogo, WindowsLogo } from "@phosphor-icons/react";
import type { PlatformId, Release } from "@/lib/releases";

const ICONS = {
  macos: AppleLogo,
  ubuntu: LinuxLogo,
  windows: WindowsLogo,
} as const;

function detectPlatform(): PlatformId | null {
  const platform = navigator.platform ?? "";
  const agent = navigator.userAgent;
  if (/Win/.test(platform)) return "windows";
  if (/Mac/.test(platform)) return "macos";
  if (/Linux/.test(platform) || /Ubuntu/i.test(agent)) return "ubuntu";
  return null;
}

function subscribeToPlatform() {
  return () => {};
}

function serverPlatform(): PlatformId | null {
  return null;
}

export function DownloadOptions({ releases, signedIn }: { releases: Release[]; signedIn: boolean }) {
  const current = useSyncExternalStore(subscribeToPlatform, detectPlatform, serverPlatform);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {releases.map((release) => {
        const Icon = ICONS[release.id];
        const yours = current === release.id;
        const available = release.status === "ready" && release.href;
        return (
          <section
            key={release.id}
            className={`panel flex flex-col p-6 md:p-8 ${yours ? "border-fg" : ""}`}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <Icon size={28} weight="regular" aria-hidden="true" />
              <p className="status">
                {yours ? "This computer" : release.status === "ready" ? "Beta" : "Coming soon"}
              </p>
            </div>
            <h2 className="text-fg mb-2 text-2xl font-[550]">{release.name}</h2>
            <p className="type-body text-muted mb-6">
              Version {release.version}
              {release.arch ? ` · ${release.arch}` : ""}
              {release.requirement ? ` · ${release.requirement}` : ""}
            </p>
            {release.fileName && (
              <p className="type-tech text-muted mb-6 break-all">{release.fileName}</p>
            )}
            <ol className="type-body text-muted mb-8 flex list-decimal flex-col gap-3 pl-5">
              {release.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {release.status === "soon" ? (
              <button type="button" className="btn btn-primary mt-auto self-start" disabled>
                Coming soon
              </button>
            ) : !signedIn ? (
              <Link href="/sign-in?next=/download" className="btn btn-primary mt-auto self-start">
                Sign in to download
              </Link>
            ) : available ? (
              <a className="btn btn-primary mt-auto self-start" href={release.href ?? undefined}>
                Download for {release.name}
              </a>
            ) : (
              <button type="button" className="btn btn-primary mt-auto self-start" disabled>
                Download link coming
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
