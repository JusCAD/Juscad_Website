"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SponsorTicker, { type Sponsor } from "@/components/home/SponsorTicker";

const EASE = [0.25, 1, 0.5, 1] as [number, number, number, number];

/**
 * Hero. The name is kept for compatibility with the page that renders it;
 * the composition is now a drafted title block: real text, construction
 * guides behind it, one figure identifier, one primary action.
 */
export function BackgroundPaths({
  title = "JusCAD",
  ctaLabel = "Join the beta",
  ctaHref = "/beta",
  ctaDate = "Live",
  downloadHref,
  subtitle,
  subtitle2,
  sponsors,
}: {
  title?: string;
  ctaLabel?: string;
  ctaHref?: string;
  subtitle?: string;
  subtitle2?: string;
  ctaDate?: string;
  downloadHref?: string;
  sponsors?: Sponsor[];
}) {
  return (
    <section className="hero-fluid-surface relative w-full overflow-hidden bg-canvas">
      <div className="container-jc relative min-h-[100svh] flex flex-col justify-center pt-28 pb-16 md:pt-36 md:pb-20">
        {/* Vertical datum — desktop only */}
        <span
          aria-hidden="true"
          className="draft-datum hidden lg:block"
          style={{ left: "calc(var(--gutter) - 24px)", top: "22%", bottom: "22%" }}
        />

        <div className="relative max-w-[62rem]">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="type-tech text-muted mb-8 md:mb-12 flex items-center gap-3"
          >
            <span>Fig. 01</span>
            <span aria-hidden="true" className="h-px w-6 bg-line-strong" />
            <span>Cognitive engineering system</span>
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
            className="type-hero text-fg mb-8 md:mb-10"
          >
            <span className="draft-line">
              {title}
              <i aria-hidden="true" />
            </span>
          </motion.h1>

          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.18 }}
              className="type-lead text-muted measure mb-4"
            >
              {subtitle}
            </motion.p>
          )}

          {subtitle2 && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.24 }}
              className="type-lead text-muted measure mb-4"
            >
              {subtitle2}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
            className="mt-8 md:mt-12 flex flex-wrap items-center gap-4"
          >
            <Link href={ctaHref} className="btn btn-primary hero-beta-cta">
              <span className="cta-label">{ctaLabel}</span>
              <span className="cta-date">{ctaDate}</span>
              <span aria-hidden="true" className="cta-arrow">→</span>
            </Link>
            {downloadHref && (
              <Link href={downloadHref} className="btn btn-secondary">
                Download
              </Link>
            )}
            <Link href="/about" className="btn btn-secondary type-tech font-semibold">
              About JusCAD
            </Link>
          </motion.div>
        </div>

        {sponsors && sponsors.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
            className="mt-20 md:mt-28"
          >
            <SponsorTicker sponsors={sponsors} />
          </motion.div>
        )}
      </div>
    </section>
  );
}
