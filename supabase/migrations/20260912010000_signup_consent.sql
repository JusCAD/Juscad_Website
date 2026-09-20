create type public.beta_application_status as enum ('submitted', 'reviewing', 'accepted', 'declined');
create type public.mailing_subscription_status as enum ('subscribed', 'unsubscribed');

alter table public.profiles
  add column terms_accepted_at timestamptz,
  add column terms_version text,
  add column privacy_accepted_at timestamptz,
  add column privacy_version text,
  add column onboarding_completed_at timestamptz;

-- Accounts that existed before this feature must not be forced through new-user onboarding.
update public.profiles set onboarding_completed_at = now();

alter table public.beta_submissions
  add column user_id uuid references public.profiles(id) on delete set null,
  add column application_status public.beta_application_status not null default 'submitted';

create unique index beta_submissions_one_per_user
  on public.beta_submissions (user_id) where user_id is not null;

create table public.mailing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email) and char_length(email) <= 254),
  user_id uuid references public.profiles(id) on delete set null,
  status public.mailing_subscription_status not null default 'subscribed',
  consent_source text not null check (consent_source in ('signup', 'beta', 'settings')),
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  token_version integer not null default 1,
  resend_contact_id text,
  resend_synced_at timestamptz,
  sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mailing_status_timestamps check (
    (status = 'subscribed' and unsubscribed_at is null)
    or (status = 'unsubscribed' and unsubscribed_at is not null)
  )
);

create unique index mailing_subscriptions_email_unique
  on public.mailing_subscriptions (lower(email));
create unique index mailing_subscriptions_user_unique
  on public.mailing_subscriptions (user_id) where user_id is not null;

alter table public.mailing_subscriptions enable row level security;
revoke all on public.mailing_subscriptions from anon, authenticated;

create trigger mailing_subscriptions_set_updated_at
  before update on public.mailing_subscriptions
  for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (
    id, display_name, role,
    terms_accepted_at, terms_version,
    privacy_accepted_at, privacy_version
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'user',
    case when new.raw_user_meta_data ->> 'terms_accepted' = 'true' then now() else null end,
    new.raw_user_meta_data ->> 'terms_version',
    case when new.raw_user_meta_data ->> 'privacy_accepted' = 'true' then now() else null end,
    new.raw_user_meta_data ->> 'privacy_version'
  );
  return new;
end;
$$;

comment on table public.mailing_subscriptions is 'Authoritative record of explicit marketing consent. Service-role access only.';
comment on column public.mailing_subscriptions.token_version is 'Incremented on unsubscribe to invalidate previously issued signed links.';
