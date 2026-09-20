# PNW Card Vault

Pacific Northwest sports-card shop. Public shop for buyers. Owner desk is the only place listings get posted.

Upload this folder to GitHub, connect it to Vercel, and use a free Supabase database.

## 1. Put this folder on GitHub

1. Unzip `pnw-card-vault-vercel.zip`.
2. Open [github.com/new](https://github.com/new) and sign in.
3. Name the repository `pnw-card-vault`. Private is fine.
4. Create the repository.
5. Upload **every file and folder inside the unzipped folder** (not the zip itself).

## 2. Make a free Supabase database

1. Open [supabase.com](https://supabase.com) and create a free account.
2. New project → name it `pnw-card-vault` → set a database password → create.
3. Wait until the project is ready.
4. Open **Project Settings → Database**.
5. Under **Connection string**, choose **URI**.
6. Pick **Session pooler** (not Transaction, not Direct).
7. Copy the URI and replace `[YOUR-PASSWORD]` with the database password from step 2.

That copied URI is your `DATABASE_URL`. It should look like:

`postgresql://postgres.xxxx:YOUR-PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres`

If it does not already include `sslmode=require`, add `?sslmode=require` at the end.

## 3. Import the GitHub repo in Vercel

1. Open [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import `pnw-card-vault`.
3. Framework: **TanStack Start**.
4. Build command: `npm run build` (already set).
5. Add these **Environment Variables** for Production, Preview, and Development **before** you deploy:

| Name | Value |
|---|---|
| `DATABASE_URL` | The Supabase Session pooler URI from step 2 |
| `BETTER_AUTH_SECRET` | `2ee5a9a5ff332d1784f47afc58565fe3a46bf0d6a578e31c83336c8d0ebf29b7` |
| `BETTER_AUTH_URL` | Your Vercel site URL, like `https://pnw-card-vault.vercel.app` (update this after the first deploy if the URL is different) |
| `VITE_AUTH_ENABLED` | `true` |

Optional later:

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe **test** key (`sk_test_...`) first, from [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) with **Test mode** on. Switch to `sk_live_...` when real charges should go to dad. |
| `XAI_API_KEY` | Only if you want AI photo enhance / auto-read on listings |

6. Click **Deploy**.

After the first deploy, copy the real site URL, set `BETTER_AUTH_URL` to that exact `https://…` address, and Redeploy.

## 4. Open the owner desk

The shop is public. The desk is locked to your owner email.

1. Open the live site.
2. Tap **Desk**.
3. Sign in with `coachingcenterapp2026@gmail.com` and a password of at least 8 characters. First time creates the owner account.
4. List cards with front + back photos.

## If the build fails

- Node version should be **22.x**.
- `DATABASE_URL` must be the Supabase **Session pooler** URI, with the real password and SSL.
- Do not upload `node_modules`. Vercel installs packages itself.
