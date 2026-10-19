export type PlatformId = "macos" | "ubuntu" | "windows";

export type Release = {
  id: PlatformId;
  name: string;
  status: "ready" | "soon";
  version: string;
  fileName: string | null;
  arch: string;
  requirement: string;
  steps: string[];
  /** Set this when the download backend is ready. Null keeps the button disabled. */
  href: string | null;
};

export const RELEASES: Release[] = [
  {
    id: "macos",
    name: "macOS",
    status: "ready",
    version: "0.1.0",
    fileName: "juscad-0.1.0-macos.zip",
    arch: "Apple silicon",
    requirement: "macOS 12 or newer",
    href: null,
    steps: [
      "Unzip the package.",
      "Double-click Install-JusCAD.command. If macOS blocks it, open System Settings, then Privacy & Security, then Open Anyway.",
      "The installer uses FreeCAD 1.1.4 if it is already installed, and downloads it if it is not.",
      "In FreeCAD, choose the JusCAD workbench and sign in.",
    ],
  },
  {
    id: "ubuntu",
    name: "Ubuntu",
    status: "ready",
    version: "0.1.0",
    fileName: "juscad-0.1.0-linux-x86_64.tar.gz",
    arch: "x86_64",
    requirement: "Ubuntu 22.04 or newer",
    href: null,
    steps: [
      "Unpack the archive with tar -xzf.",
      "Run ./end_user_install.sh.",
      "Start JusCAD with the juscad command.",
      "In FreeCAD, choose the JusCAD workbench and sign in.",
    ],
  },
  {
    id: "windows",
    name: "Windows",
    status: "soon",
    version: "0.1.0",
    fileName: null,
    arch: "x86_64",
    requirement: "Windows 10 or newer",
    href: null,
    steps: ["The Windows build is not ready yet. Use macOS or Ubuntu for this beta."],
  },
];
