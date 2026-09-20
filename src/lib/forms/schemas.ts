import { z } from "zod";

const spamFields = {
  website: z.string().max(0).optional().default(""),
  startedAt: z.number().int().positive(),
  turnstileToken: z.string().max(4096).optional().default(""),
};

const text = (max: number) => z.string().trim().max(max).optional().default("");

export const betaApplicationSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  role: text(100), organization: text(160), operating_system: text(80),
  feature_requests: text(500), whatYouBuild: text(2000), frustration: text(2000),
  marketingOptIn: z.boolean().optional().default(false),
  ...spamFields,
});

export const contactInquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  type: text(80),
  message: z.string().trim().min(10, "Enter at least 10 characters.").max(5000),
  ...spamFields,
});

export const jobApplicationSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  role: z.string().trim().min(2, "Choose a role.").max(140),
  portfolio: z.union([z.literal(""), z.string().trim().url().max(500)]).optional().default(""),
  whyJuscad: text(5000), favoriteProblem: text(5000),
  ...spamFields,
});

export type BetaApplication = z.infer<typeof betaApplicationSchema>;
export type ContactInquiry = z.infer<typeof contactInquirySchema>;
export type JobApplication = z.infer<typeof jobApplicationSchema>;
