# Expiry Pocket

React + TypeScript + Vite, with Supabase Auth, Postgres, and private Storage.
Installable on supported mobile browsers; no separate native app is required.

## Start locally

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set your Supabase project URL and publishable key.
This checkout already has the provided project's browser configuration in an ignored local file.
Never put a Supabase secret/service_role key into a VITE_ variable.

## Connect Supabase

1. Open https://supabase.com/dashboard/project/gibbjvdwugvoldcpttfd/sql/new
2. Run the contents of `supabase/schema.sql`. It creates the documents table, enables row level security, and creates a private documents bucket with per-user file policies.
3. In Authentication > URL Configuration, set Site URL to http://127.0.0.1:5173 and allow http://127.0.0.1:5173/ and http://localhost:5173/ as redirect URLs.
4. Configure Google and Email providers as described below. Email signup requires Confirm email to be disabled.
5. Add a document and optional PDF/photo; confirm it remains after reload and can be downloaded. A second account must not see the first account's documents or files.

The browser uses the signed-in user's access token. The supplied publishable key grants no administrative access. The SQL must be applied before document operations work.

## Features

- Google sign-in first, with email/password signup and sign-in as a fallback. No confirmation email when the Email provider is configured below.
- Vehicles, Personal, Home, Health, and Other categories.
- Expiry dashboard, search, category/status filters, and a renewal checklist.
- Optional private PDF/JPG/PNG/WebP uploads up to 5 MB.
- Download attachments, delete documents, and add renewed versions.
- Reminder lead times of 1, 3, 7, 14, 30, 60, or 90 days.
- Responsive layout and a web app manifest for phone installation.

## Notifications: pending setup

Reminder dates currently drive the in-app checklist. No automatic WhatsApp or background push messages are sent yet, and the app labels these channels as needing setup.

For production WhatsApp reminders:
- Choose Meta Cloud API or a provider such as Twilio.
- Register a WhatsApp Business sender and configure an approved utility reminder template.
- Collect and store user consent and their destination phone number.
- Deploy a scheduled Supabase Edge Function to find due documents and send notifications.
- Keep provider credentials in Edge Function secrets, never in browser code.
- Store a delivery ledger with unique document/channel/reminder-date keys; retry transient failures without duplicating successful sends.

For background push:
- Generate a VAPID key pair and configure server secrets.
- Collect browser notification permission after a user action and store push subscriptions with user-based RLS.
- Add service-worker push/click handlers and an Edge Function sender.
- Schedule delivery using Supabase Cron. The app must be installed on iOS for web push.
- Confirm delivery on actual iOS and Android devices.

No scheduler, messaging account, or billable provider has been configured by this project.

## Build

```sh
npm run build
npm run preview
```

The output is a static `dist/` folder suitable for static hosting.

The service worker does not cache private documents and does not provide offline document access.


## Google first, email without confirmation

These settings are configured in your Supabase dashboard, not by the browser's publishable key.

### Google

1. In Google Cloud, create an OAuth client of type **Web application** with the app's consent screen.
2. Add these Authorized JavaScript origins:
   - http://127.0.0.1:5173
   - http://localhost:5173
3. Add this Authorized redirect URI:
   - https://gibbjvdwugvoldcpttfd.supabase.co/auth/v1/callback
4. In Supabase > Authentication > Sign In / Providers > Google, enable Google and save the OAuth Client ID and Client Secret. Keep the secret in Supabase; never add it to VITE_ variables.
5. If Google's OAuth app is in Testing mode, add your Google account as a test user. Configure the audience for your intended users before launch.

### Email

In Supabase > Authentication > Sign In / Providers > Email:
- Keep the Email provider enabled.
- Turn **Confirm email OFF** and save.
- Keep new-user signups enabled.

New email users then receive an immediate session after choosing an email address and password. The app checks the public auth settings before signup and does not request signup while confirmation is enabled, avoiding unwanted confirmation emails. Previously created unconfirmed accounts may still need to be confirmed in Supabase or recreated.

### Redirects

In Authentication > URL Configuration:
- Set Site URL to http://127.0.0.1:5173.
- Add http://127.0.0.1:5173/ and http://localhost:5173/ for local development.

### Verify

Run `node scripts/check-connection.mjs` to check the public auth configuration without creating users or sending emails. It should show Google sign-in enabled and Email signup without confirmation as true.

Then test in the browser:
- Continue with Google, select an account, and return to the dashboard.
- Sign out and register a new personal email/password; the dashboard should open immediately.
- Sign out and sign back in with those credentials.
- Cancel Google authorization and confirm that email sign-in remains available.


References: https://supabase.com/docs/guides/auth/social-sign-in/auth-google and https://supabase.com/docs/guides/auth/general-configuration

