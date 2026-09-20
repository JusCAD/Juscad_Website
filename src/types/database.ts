export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "user" | "admin";
export type BlogPostStatus = "draft" | "published" | "archived";
export type BetaApplicationStatus = "submitted" | "reviewing" | "accepted" | "declined";
export type MailingSubscriptionStatus = "subscribed" | "unsubscribed";

type ProfileRow = {
  id: string;
  display_name: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
  terms_accepted_at: string | null;
  terms_version: string | null;
  privacy_accepted_at: string | null;
  privacy_version: string | null;
  onboarding_completed_at: string | null;
};

export type MailingSubscription = {
  id: string;
  email: string;
  user_id: string | null;
  status: MailingSubscriptionStatus;
  consent_source: "signup" | "beta" | "settings";
  consented_at: string;
  unsubscribed_at: string | null;
  token_version: number;
  resend_contact_id: string | null;
  resend_synced_at: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content_markdown: string;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: BlogPostStatus;
  author_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        { id: string; display_name?: string | null; role?: AppRole; terms_accepted_at?: string | null; terms_version?: string | null; privacy_accepted_at?: string | null; privacy_version?: string | null; onboarding_completed_at?: string | null },
        { display_name?: string | null; role?: AppRole; updated_at?: string; terms_accepted_at?: string | null; terms_version?: string | null; privacy_accepted_at?: string | null; privacy_version?: string | null; onboarding_completed_at?: string | null }
      >;
      blog_posts: Table<
        BlogPost,
        Omit<BlogPost, "id" | "created_at" | "updated_at"> & { id?: string },
        Partial<Omit<BlogPost, "id" | "created_at">>
      >;
      beta_submissions: Table<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>;
      mailing_subscriptions: Table<MailingSubscription, Partial<MailingSubscription> & Pick<MailingSubscription, "email" | "consent_source">, Partial<MailingSubscription>>;
      contact_submissions: Table<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>;
      job_applications: Table<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>;
      form_rate_limits: Table<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
      blog_post_status: BlogPostStatus;
      beta_application_status: BetaApplicationStatus;
      mailing_subscription_status: MailingSubscriptionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
