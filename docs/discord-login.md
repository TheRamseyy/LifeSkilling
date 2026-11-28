# Turning on "Sign in with Discord"

Saved recipes always work on your own device. Signing in with Discord keeps them on every device. GitHub Pages
can only serve files, so the sign-ins and saves live in a free **Supabase** project. You set it up once (about
15 minutes); after that it runs by itself.

What gets stored: your Discord name and picture (from Discord), and the list of items you saved. Nothing else.

## 1. Create the Supabase project

1. Go to https://supabase.com and sign up (free plan).
2. Click **New project**. Pick any name (for example `aeternum-crafting`), set a database password (keep it
   somewhere safe, the site never needs it) and a region near you. Click **Create new project** and wait a minute.
3. Open **Project Settings > API**. Keep this tab open: you need the **Project URL** and the **anon public**
   key (it may be called the **publishable** key).

## 2. Create the Discord app

1. Go to https://discord.com/developers/applications and click **New Application**. Name it
   `Aeternum Crafting`.
2. Open **OAuth2**. Under **Redirects**, click **Add Redirect** and paste:
   `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`
   (your Project URL from step 1 with `/auth/v1/callback` on the end). Save.
3. On the same page, copy the **Client ID**, then click **Reset Secret** and copy the **Client Secret**.

## 3. Connect Discord to Supabase

1. In Supabase, open **Authentication > Sign In / Providers** (or **Providers**), find **Discord** and turn it on.
2. Paste the Discord **Client ID** and **Client Secret**. Save. (The secret stays inside Supabase; it never goes
   in the website files.)
3. Open **Authentication > URL Configuration**:
   - **Site URL**: `https://theramseyy.github.io/LifeSkilling/`
   - **Redirect URLs**: add `https://theramseyy.github.io/LifeSkilling/` and, for testing on your PC,
     `http://localhost:8765/`

## 4. Create the table for saves

In Supabase, open **SQL Editor**, click **New query**, paste all of this and click **Run**:

```sql
create table public.user_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  saved jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.user_saves enable row level security;

-- each person can only see and change their own row
create policy "read own saves" on public.user_saves
  for select using (auth.uid() = user_id);
create policy "add own saves" on public.user_saves
  for insert with check (auth.uid() = user_id);
create policy "change own saves" on public.user_saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own saves" on public.user_saves
  for delete using (auth.uid() = user_id);

-- signed-in people may use the table (the rules above still limit them to their own row)
grant select, insert, update, delete on public.user_saves to authenticated;
```

## 5. Put the two public values in the site

Open `js/core/config.js` and fill in:

```js
App.SUPABASE={
  url:"https://YOUR-PROJECT-ID.supabase.co",
  key:"the anon public key"
};
```

These two are meant to be public: the security rules in step 4 stop anyone reading or changing someone else's
saves. Never put the Discord Client Secret or the database password in the site.

Then change the `?v=` tag in `index.html` (see `deploying.md`), commit and push. A **Sign in with Discord**
button appears at the top right.

## If something goes wrong

- **"redirect_uri" error from Discord**: the redirect in step 2 must be exactly your Supabase URL with
  `/auth/v1/callback` on the end.
- **You come back to the site but are not signed in**: check the Site URL and Redirect URLs in step 3.
- **"Could not save online"** on the Saved recipes page: run the SQL in step 4 again and check it said "Success".
- To remove someone's saves: Supabase > **Authentication > Users**, delete the user (their saves go with them).
