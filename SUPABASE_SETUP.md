# Supabase Setup for Registration + Training Access Approval

This project now uses a real auth flow designed for GitHub Pages:
- User registers on `register.html`
- Account is created in Supabase Auth
- A DB trigger copies registration metadata into `learner_profiles` with `approved = false`
- Admin approves user in Supabase
- Only approved users can access training pages

## 1) Add your Supabase keys

Edit:
- `assets/js/auth-config.js`

Replace:
- `REPLACE_WITH_SUPABASE_URL`
- `REPLACE_WITH_SUPABASE_ANON_KEY`

## 2) Create profile table + trigger

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.learner_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  parish_team text not null,
  role_type text not null check (role_type in ('responsible', 'to-be-responsible')),
  age_group text not null check (age_group in ('6-8', '9-12', '13-15', '16-18')),
  phone text not null,
  email text not null unique,
  age integer not null check (age between 6 and 70),
  notes text default '',
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_learner_profiles_updated_at on public.learner_profiles;
create trigger trg_learner_profiles_updated_at
before update on public.learner_profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.learner_profiles (
    id,
    full_name,
    parish_team,
    role_type,
    age_group,
    phone,
    email,
    age,
    notes,
    approved
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'parish_team', ''),
    coalesce(new.raw_user_meta_data ->> 'role_type', ''),
    coalesce(new.raw_user_meta_data ->> 'age_group', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    lower(coalesce(new.email, '')),
    coalesce((new.raw_user_meta_data ->> 'age')::int, 0),
    coalesce(new.raw_user_meta_data ->> 'notes', ''),
    false
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    parish_team = excluded.parish_team,
    role_type = excluded.role_type,
    age_group = excluded.age_group,
    phone = excluded.phone,
    email = excluded.email,
    age = excluded.age,
    notes = excluded.notes;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
```

## 3) Enable Row Level Security

```sql
alter table public.learner_profiles enable row level security;

-- User can read only their own profile row
create policy "read own profile"
on public.learner_profiles
for select
to authenticated
using (auth.uid() = id);

-- User can update only their own profile row (optional)
create policy "update own profile"
on public.learner_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

## 4) Auth settings

In Supabase Auth settings:
- Enable Email/Password provider.
- Configure your site URL and redirect URLs for your GitHub Pages domain.

## 5) Admin approval process

In Supabase Table Editor:
- Open `learner_profiles`
- Find new user
- Set `approved = true`

Only then can that user access:
- `catalogue.html`
- `module-1..5.html`
- `training-template.html`
- `resources.html`
- `dashboard.html`

## 6) Optional improvements

- Add admin dashboard to approve users without opening Supabase UI.
- Add email notification webhook when a new profile is created.
- Move training content to protected backend storage for stronger content secrecy.

Note: On static hosting, page-source content can still be inspected if content is embedded directly in HTML. Current implementation enforces functional access control in the app flow.
