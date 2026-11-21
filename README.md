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
3. In Authentication > URL Configuration, add your deployed app URL and http://localhost:5173 to the allowed redirect URLs. Set the Site URL to your chosen production URL.
4. Enable the Email provider. Create an account in the app and confirm the email.
5. Add a document and optional PDF/photo; confirm it remains after reload and can be downloaded. A second account must not see the first account's documents or files.

The browser uses the signed-in user's access token. The supplied publishable key grants no administrative access. The SQL must be applied before document operations work.

## Features

- Email/password signup, confirmation, and sign-in through Supabase.
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
This project's Sites hosting manifest points to that directory. Its current Sites audience is private.
The Sites outer access gate and Supabase app login are separate; opening this to other users requires a requested hosting access change.

The service worker does not cache private documents and does not provide offline document access.

