"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { SpamProtection } from "@/components/forms/SpamProtection";
import { betaApplicationSchema } from "@/lib/forms/schemas";
import { track } from "@vercel/analytics";

type FormState = "idle" | "loading" | "success" | "error";

const ROLE_OPTIONS = [
  "Mechanical Engineer",
  "Aerospace Engineer",
  "Structural Engineer",
  "CAD Designer",
  "Systems Engineer",
  "Research Scientist",
  "Engineering Manager",
  "CTO / Technical Lead",
  "Student / Academic",
  "Other",
];

const EASE = [0.25, 1, 0.5, 1] as [number, number, number, number];

function Field({
  id,
  label,
  helper,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  helper?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="field-label-optional">Optional</span>}
      </label>
      {children}
      {helper && !error && (
        <span id={`${id}-help`} className="field-help">
          {helper}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="field-error" role="alert">
          <span aria-hidden="true">✕</span>
          {error}
        </span>
      )}
    </div>
  );
}

export default function BetaForm({ initialName = "", initialEmail = "", existingStatus }: { initialName?: string; initialEmail?: string; existingStatus?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.1, once: true });
  const [formState, setFormState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const startedAt = useRef(0);

  const [fields, setFields] = useState({
    name: initialName,
    email: initialEmail,
    role: "",
    organization: "",
    operating_system: "",
    feature_requests: "",
    whatYouBuild: "",
    frustration: "",
  });

  function validate() {
    const result = betaApplicationSchema.safeParse({ ...fields, marketingOptIn, website: "", startedAt: startedAt.current || Date.now(), turnstileToken });
    const errs: Record<string, string> = {};
    if (!result.success) result.error.issues.forEach((issue) => { const key = String(issue.path[0] ?? "form"); if (!errs[key]) errs[key] = issue.message; });
    return errs;
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitError("");
    setFormState("loading");

    try {
      const res = await fetch("/api/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, marketingOptIn, website: "", startedAt: startedAt.current || Date.now(), turnstileToken }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Submission failed.");
      track("beta_form_submitted");
      setFormState("success");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed.");
      setFormState("error");
    }
  }

  return (
    <section
      ref={sectionRef}
      className="relative flex items-center bg-canvas overflow-hidden border-t border-line"
      id="beta"
    >
      <div className="container-jc py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-16 lg:gap-24 items-start">
          <div className="lg:sticky lg:top-32 max-w-[32rem]">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE }}
              className="eyebrow mb-8"
            >
              <span>04</span>
              <span>Beta program</span>
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
              className="type-section text-fg mb-8"
            >
              Compress design cycles from weeks to hours.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
              className="type-body text-muted measure-narrow"
            >
              We integrate into the CAD, simulation, and analysis tools you
              already use. Early access is limited and curated — for engineers
              who think deeply about the cost of every iteration.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
          >
            {existingStatus ? (
              <div className="panel p-8 md:p-12" role="status">
                <p className="status status-ok mb-6">Application already received</p>
                <p className="type-small text-fg mb-4">Status: {existingStatus}</p>
                <p className="type-body text-muted measure-narrow">You do not need to submit another application. We will contact you when its status changes.</p>
              </div>
            ) : formState === "success" ? (
              <div className="panel p-8 md:p-12" role="status">
                <p className="status status-ok mb-6">
                  <span aria-hidden="true">✓</span>
                  Application received
                </p>
                <p className="type-small text-fg mb-4">We will be in touch.</p>
                <p className="type-body text-muted measure-narrow">
                  Your application is under review. We are building a small,
                  focused cohort of engineers for the first release.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                onFocusCapture={() => { if (!startedAt.current) startedAt.current = Date.now(); }}
                noValidate
                className="panel p-6 md:p-10 flex flex-col gap-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field id="name" label="Name" error={errors.name}>
                    <input
                      id="name"
                      name="name"
                      autoComplete="name"
                      className="field-input"
                      placeholder="Elara Vasquez"
                      value={fields.name}
                      aria-invalid={errors.name ? true : undefined}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      onChange={(e) =>
                        setFields((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </Field>
                  <Field id="email" label="Email" error={errors.email}>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="field-input"
                      placeholder="elara@structures.io"
                      value={fields.email}
                      aria-invalid={errors.email ? true : undefined}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      onChange={(e) =>
                        setFields((f) => ({ ...f, email: e.target.value }))
                      }
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field id="role" label="Role" error={errors.role} optional>
                    <select
                      id="role"
                      name="role"
                      className="field-input"
                      value={fields.role}
                      onChange={(e) =>
                        setFields((f) => ({ ...f, role: e.target.value }))
                      }
                    >
                      <option value="" disabled>
                        Select role
                      </option>
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    id="organization"
                    label="Organization"
                    helper="Company, lab, or institution"
                    error={errors.organization}
                    optional
                  >
                    <input
                      id="organization"
                      name="organization"
                      autoComplete="organization"
                      className="field-input"
                      placeholder="Orbital Systems Ltd."
                      value={fields.organization}
                      aria-describedby="organization-help"
                      onChange={(e) =>
                        setFields((f) => ({ ...f, organization: e.target.value }))
                      }
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field
                    id="operating_system"
                    label="Operating system"
                    error={errors.operating_system}
                    optional
                  >
                    <input
                      id="operating_system"
                      name="operating_system"
                      className="field-input"
                      placeholder="Windows, macOS, Linux…"
                      value={fields.operating_system}
                      onChange={(e) =>
                        setFields((f) => ({ ...f, operating_system: e.target.value }))
                      }
                    />
                  </Field>
                  <Field
                    id="feature_requests"
                    label="Feature requests"
                    error={errors.feature_requests}
                    optional
                  >
                    <input
                      id="feature_requests"
                      name="feature_requests"
                      className="field-input"
                      placeholder="What would you like to see?"
                      value={fields.feature_requests}
                      onChange={(e) =>
                        setFields((f) => ({ ...f, feature_requests: e.target.value }))
                      }
                    />
                  </Field>
                </div>

                <Field
                  id="whatYouBuild"
                  label="What type of projects do you work on?"
                  error={errors.whatYouBuild}
                  optional
                >
                  <textarea
                    id="whatYouBuild"
                    name="whatYouBuild"
                    className="field-input"
                    placeholder="Aerospace structures, turbomachinery, satellite components…"
                    value={fields.whatYouBuild}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, whatYouBuild: e.target.value }))
                    }
                  />
                </Field>

                <Field
                  id="frustration"
                  label="Biggest workflow frustration?"
                  helper="What is the biggest pain point you feel could be automated? High effort, low value."
                  error={errors.frustration}
                  optional
                >
                  <textarea
                    id="frustration"
                    name="frustration"
                    className="field-input"
                    aria-describedby="frustration-help"
                    value={fields.frustration}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, frustration: e.target.value }))
                    }
                  />
                </Field>

                {formState === "error" && (
                  <p className="status status-error" role="alert">
                    <span aria-hidden="true">✕</span>
                    {submitError || "Submission failed. Please try again or reach out directly."}
                  </p>
                )}

                <SpamProtection onToken={setTurnstileToken} />

                <label className="consent-row">
                  <input type="checkbox" checked={marketingOptIn} onChange={(event) => setMarketingOptIn(event.target.checked)} />
                  <span>Send me occasional JusCAD product and beta updates. I can unsubscribe at any time. <em>Optional</em></span>
                </label>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={formState === "loading"}
                    className="btn btn-primary"
                  >
                    {formState === "loading" ? "Submitting…" : "Request access"}
                  </button>
                  <p className="field-help mt-4">By requesting access, you agree to our <Link href="/terms" className="underline underline-offset-4">Terms</Link> and <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.</p>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
