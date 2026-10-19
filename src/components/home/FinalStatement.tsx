"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { LogoStacked } from "@/components/brand/Logo";

const EASE = [0.25, 1, 0.5, 1] as [number, number, number, number];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.1 },
  },
};

const lineVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

export default function FinalStatement() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.2, once: true });

  return (
    <section
      ref={sectionRef}
      className="relative bg-canvas overflow-hidden border-t border-line"
    >
      <div className="container-jc py-32 md:py-44">
        <div className="mx-auto max-w-[44rem] text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE }}
            className="text-fg mb-14 md:mb-16"
          >
            <LogoStacked height={168} />
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="mb-12"
          >
            <motion.p
              variants={lineVariants}
              className="type-small text-muted mb-3 text-balance"
            >
              The next generation of engineering software will not be defined
              by menus and commands.
            </motion.p>
            <motion.p variants={lineVariants} className="type-small text-fg">
              It will be defined by cognition.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6, ease: EASE }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/beta" className="btn btn-primary">
              Join the beta
            </Link>
            <Link href="/download" className="btn btn-secondary">
              Download
            </Link>
            <Link href="/about" className="btn btn-secondary">
              Read the thesis
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
