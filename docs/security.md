# Keeping the site and its sign-ins safe

## What there is to protect

- **The website** is plain files on GitHub Pages. There is no server of ours to break into. GitHub serves it over
  HTTPS through its own CDN (Fastly), which already absorbs traffic floods.
- **Your GitHub account** controls the files. Whoever gets into it can change the site.
- **Supabase** holds sign-ins (Discord name and picture) and each person's saved list.

## Already in place (in the code)

- A Content Security Policy in `index.html`: the browser only runs this site's own scripts, and only talks to this
  site and the Supabase project. If someone ever slipped code into a page, it could not run or send a sign-in
  anywhere else. If the Supabase project address changes, update `connect-src` there too.
- Every bit of text put into the page is escaped (item names, Discord names), and Discord pictures are only
  shown from Discord's own image server.
- No secrets in the repo: only the Supabase **publishable** key, which is meant to be public.
- Row-level security on the saves table: each person can only read and change their own row. Checked: someone
  who is not signed in can neither read nor write the table, and the list of tables is hidden.

## Do these once (only you can)

1. **Turn off email sign-up in Supabase.** Sign-in is Discord only, but Supabase starts with email sign-up on,
   so anyone could create email accounts through the public key.
   Supabase > **Authentication > Sign In / Providers** > **Email** > turn it off. Leave **Discord** on.
2. **Limit the size of saves.** In Supabase > **SQL Editor**, run:
   ```sql
   alter table public.user_saves add constraint saved_is_small
     check (jsonb_typeof(saved) = 'array' and jsonb_array_length(saved) <= 1000 and pg_column_size(saved) < 200000);
   ```
3. **Two-factor sign-in (2FA)** on the three accounts that control things:
   - GitHub: **Settings > Password and authentication > Two-factor authentication**.
   - Supabase: **Account > Security** (multi-factor authentication).
   - Discord: **User Settings > My Account > Enable Authenticator App** (protects the Discord app's secret).
4. **Never paste secrets into the site or a chat**: the Supabase **secret / service_role** key, the database
   password and the Discord **Client Secret** stay in Supabase and Discord only. If one leaks, rotate it there
   (Supabase > Project Settings > API keys; Discord > OAuth2 > Reset Secret).
5. **Who can change the site**: on GitHub, repository **Settings > Collaborators**, only add people you trust.

## Cloudflare and Render: not needed

- **Cloudflare** sits in front of a site on your own domain name to filter attacks. GitHub Pages already serves
  through a CDN with HTTPS and flood protection, and the site has no login form or server of its own to attack.
  It only becomes useful if you buy a custom domain; then it can be added in front with its free plan.
- **Render** (or any server host) would be for running server code. This site needs none: sign-ins and saves
  go straight to Supabase, protected by its rules. Adding a server would add something new to keep patched and
  safe, so it would make things less safe, not more.

## If something looks wrong

- Strange accounts in Supabase > **Authentication > Users**: delete them (their saves go with them), and check
  step 1 is done.
- Someone changed the site: check the commit history on GitHub, revert the change, change your GitHub password
  and check 2FA is on.
