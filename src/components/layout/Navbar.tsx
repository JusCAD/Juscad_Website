"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { List, X, Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { LogoHorizontal } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Download", href: "/download" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Join us", href: "/join-us" },
  { label: "Contact", href: "/contact" },
];

const EASE = [0.25, 1, 0.5, 1] as [number, number, number, number];

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isNight = theme === "night";
  return (
    <button
      type="button"
      onClick={(e) =>
        toggleTheme({ clientX: e.clientX, clientY: e.clientY })
      }
      className="btn btn-ghost btn-icon"
      aria-label={isNight ? "Switch to day theme" : "Switch to night theme"}
      aria-pressed={isNight}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isNight ? (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: -30 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 30 }}
            transition={{ duration: 0.18 }}
            className="flex"
          >
            <Sun size={20} weight="regular" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: 30 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: -30 }}
            transition={{ duration: 0.18 }}
            className="flex"
          >
            <Moon size={20} weight="regular" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScroll = useRef(0);
  const [hidden, setHidden] = useState(false);
  const [account, setAccount] = useState<{ signedIn: boolean; admin: boolean }>({ signedIn: false, admin: false });

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > lastScroll.current && y > 100);
      lastScroll.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    async function loadAccount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setAccount({ signedIn: false, admin: false });
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      setAccount({ signedIn: true, admin: data?.role === "admin" });
    }
    void loadAccount();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void loadAccount(); });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <>
      <motion.header
        animate={{ y: hidden && !mobileOpen ? -100 : 0 }}
        transition={{ duration: 0.24, ease: EASE }}
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-[180ms] ${
          scrolled || mobileOpen
            ? "border-line backdrop-blur-md"
            : "border-transparent"
        }`}
        style={
          mobileOpen
            ? { background: "var(--canvas)" }
            : scrolled
              ? { background: "var(--nav-bg)" }
              : {}
        }
      >
        <div className="container-jc h-16 md:h-[72px] flex items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center text-fg rounded-[2px] -ml-1 pl-1 pr-1"
            aria-label="JusCAD — home"
          >
            <LogoHorizontal height={26} />
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative px-3 py-2 text-sm font-[550] rounded-[4px] transition-colors duration-[180ms] ${
                    active
                      ? "text-fg"
                      : "text-muted hover:text-fg hover:bg-surface"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute left-3 right-3 -bottom-px h-px bg-blue"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {account.admin && <Link href="/admin/blog" className="btn btn-ghost btn-sm">Admin</Link>}
            <Link href={account.signedIn ? "/settings" : "/sign-in"} className="btn btn-secondary btn-sm">
              {account.signedIn ? "Account" : "Sign in"}
            </Link>
            <Link href="/beta" className="btn btn-primary btn-sm">
              Join the beta
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? (
                <X size={22} weight="regular" />
              ) : (
                <List size={22} weight="regular" />
              )}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="fixed inset-x-0 top-16 z-40 border-b border-line bg-canvas md:hidden"
          >
            <nav aria-label="Primary" className="container-jc py-4 flex flex-col">
              {NAV_LINKS.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between min-h-12 py-3 text-lg font-[550] border-b border-line last:border-b-0 ${
                      active ? "text-fg" : "text-muted"
                    }`}
                  >
                    {link.label}
                    {active && (
                      <span aria-hidden="true" className="w-6 h-px bg-blue" />
                    )}
                  </Link>
                );
              })}
              <Link
                href={account.signedIn ? "/settings" : "/sign-in"}
                onClick={() => setMobileOpen(false)}
                className="btn btn-secondary mt-6 w-full"
              >
                {account.signedIn ? "Account" : "Sign in"}
              </Link>
              {account.admin && <Link href="/admin/blog" onClick={() => setMobileOpen(false)} className="btn btn-secondary mt-3 w-full">Admin</Link>}
              <Link
                href="/beta"
                onClick={() => setMobileOpen(false)}
                className="btn btn-primary mt-3 w-full"
              >
                Join the beta
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
