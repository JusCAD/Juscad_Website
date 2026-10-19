import Link from "next/link";
import { LogoHorizontal } from "@/components/brand/Logo";

const FOOTER_LINKS = {
  Product: [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: "Beta program", href: "/beta" },
    { label: "Download", href: "/download" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Join us", href: "/join-us" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative z-10 bg-canvas border-t border-line">
      <div className="container-jc py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 md:gap-16 mb-16 md:mb-24">
          <div className="flex flex-col gap-6">
            <Link
              href="/"
              className="inline-flex self-start text-fg"
              aria-label="JusCAD — home"
            >
              <LogoHorizontal height={32} />
            </Link>
            <p className="text-base text-muted leading-relaxed max-w-[38ch]">
              Building cognitive tools for engineering.
              <br />
              The next paradigm of how engineers think with software.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <nav key={group} aria-label={group} className="flex flex-col gap-3">
              <span className="type-tech text-muted mb-1">{group}</span>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base text-fg/80 hover:text-fg transition-colors duration-[180ms] self-start"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="border-t border-line pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <span className="type-tech-sm text-muted">
            &copy; {new Date().getFullYear()} JusCAD. All rights reserved.
          </span>
          <span className="type-tech-sm text-muted">
            Cognitive engineering systems
          </span>
        </div>
      </div>
    </footer>
  );
}
