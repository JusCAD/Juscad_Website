import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { BetaOptInSync } from "@/components/auth/BetaOptInSync";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const adwaitaSans = localFont({
  src: "./fonts/AdwaitaSans-Variable.woff2",
  variable: "--font-adwaita-sans",
  weight: "100 900",
  display: "swap",
});

const adwaitaMono = localFont({
  src: "./fonts/AdwaitaMono-Regular.woff2",
  variable: "--font-adwaita-mono",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://juscad.com"),
  title: "JusCAD — Cognitive Engineering Systems",
  description:
    "An AI-native cognitive engineering system. Built for engineering thought, not just engineering commands.",
  alternates: { canonical: "/" },
  twitter: { card: "summary_large_image", title: "JusCAD — Cognitive Engineering Systems", description: "An AI-native cognitive engineering system." },
  openGraph: {
    title: "JusCAD — Cognitive Engineering Systems",
    description:
      "The next generation of engineering software will not be defined by menus and commands. It will be defined by cognition.",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "JusCAD — Cognitive Engineering Systems" }],
  },
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("juscad-theme");
    if (stored === "dark") stored = "night";
    if (stored === "light") stored = "day";
    var theme = stored === "night" || stored === "day"
      ? stored
      : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day");
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = "day";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="day"
      className={`${adwaitaSans.variable} ${adwaitaMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <MotionProvider>
            <SmoothScrollProvider>
              <BetaOptInSync />
              <Navbar />
              {children}
              <Footer />
              <Analytics />
              <SpeedInsights />
            </SmoothScrollProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
