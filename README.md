# QuickChat (chat.therama.dev)

QuickChat is a modern real-time chat application built with Angular and Supabase, containerized with Docker, and deployed on EC2 behind Nginx with HTTPS.

## Features

- Real-time messaging via Supabase Realtime
- Smart Friends list:
  - Shows only users you have chatted with or explicitly added via search
  - Last message preview and time; auto-sorts by most recent activity
- Presence indicators (online status) via Realtime Presence
- Avatars (from user `profiles.avatar_url`)
- OTP-based email auth (login/signup) with Supabase
- Clean branding with footer: © 2025 All rights reserved — therama.dev link
- Responsive UI (Tailwind CSS)
- CI/CD via GitHub Actions → ECR Public → EC2 (docker compose)
- HTTPS with Cloudflare Origin Certificates (Nginx)
 - Attachments (images, videos, docs, archives) with client-side validation and previews
 - Emoji picker (full catalogue) using `emoji-picker-element`

## Prerequisites

- Node.js 20.x and npm 9.x+
- Supabase project (URL + anon keys) with tables and policies (see below)
- AWS account with EC2; Docker installed on the instance
- Cloudflare Origin Certificate and Key placed on EC2:
  - `/etc/ssl/cloudflare/origin.crt`
  - `/etc/ssl/cloudflare/origin.key`

## Getting Started (Local Dev)

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment (Supabase URL/anon key) in your Angular environment files
4. Run: `npm start`
5. Open `http://localhost:4200`

Attachments & Emoji setup:

1. Create a private Supabase Storage bucket named `chat.therama.dev`.
2. Add Storage RLS policies to allow insert/select/update/delete for objects owned by the user (prefix `${auth.uid()}/...`).
3. Install emoji picker dependency (already included): `emoji-picker-element`.
4. The UI provides a paperclip to attach files and a smiley button to open the emoji picker.

## Backend (Supabase)

Tables and RLS summary:

- `profiles(id uuid primary key, email text, name text, avatar_url text, ...)`
- `messages(id uuid, sender_id uuid, receiver_id uuid, content text, created_at timestamptz)`
  - RLS: users can select their conversations and insert messages they send
  - Realtime publication added for `public.messages`
- `contacts(user_id uuid, contact_id uuid, created_at timestamptz)`
  - RLS: select/insert/delete allowed where `user_id = auth.uid()`

Storage (attachments):

- Private bucket: `chat.therama.dev`
- RLS policies on `storage.objects` scope access to the owner’s prefix `${auth.uid()}/...`
- App stores only storage `path` in message payloads; signed URLs are generated on demand for rendering
- Client-side validation:
  - Max size: 1 MB
  - Allowed MIME types: see `src/app/feature/dashboard/dashboard.ts` `ACCEPTED_MIME_LIST`

Friends list logic:

- Union of (1) contacts you added via email search and (2) distinct counterparts from your messages.
- Joined to `profiles` to show name, email, avatar.
- Enriched last message meta for preview and sorting.

Presence:

- A global Realtime presence channel tracks online user IDs and displays status dots in UI.

## Deployment (Docker + Nginx HTTPS → EC2)

The app is built and pushed to ECR Public via GitHub Actions, then pulled and started on EC2 with docker compose. Nginx inside the container serves the Angular dist and terminates TLS with Cloudflare Origin Certificates.

Key files:

- `Dockerfile` — multi-stage build and nginx runtime; exposes `80 443`
- `docker/nginx.conf` — HTTP→HTTPS redirect, HTTPS server, SPA fallback, assets caching
- `deploy/docker-compose.yml` — publishes `80:80`, `443:443` and mounts certs from host:
  - `/etc/ssl/cloudflare/origin.crt:/etc/ssl/cloudflare/origin.crt:ro`
  - `/etc/ssl/cloudflare/origin.key:/etc/ssl/cloudflare/origin.key:ro`

EC2 prerequisites:

- Place certs at `/etc/ssl/cloudflare/` (paths must match nginx.conf)
- Open security group inbound for 80 and 443 (port 80 is only for redirect)

## CI/CD (GitHub Actions → ECR Public → EC2)

Workflow: `.github/workflows/deploy.yml`

- Builds the image and pushes to `public.ecr.aws/...` repository
- Uploads `deploy/docker-compose.yml` to EC2
- SSH into EC2 and runs `docker compose up -d` with the new `IMAGE` tag

Required GitHub Secrets:

- `AWS_ACCESS_KEY_ID_GLOBAL`
- `AWS_SECRET_ACCESS_KEY_GLOBAL`
- `AWS_REGION`
- `EC2_USER`
- `EC2_HOST`
- `EC2_SSH_KEY` (private key content for SSH)
- `S3_UPLOAD_BUCKET` (used by the final logging step)

Optional improvements:

- Enable HTTP/2: `listen 443 ssl http2;`
- HSTS: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`
- Strong SSL ciphers and TLS 1.3

## Environment Configuration

- Development: `environment.ts`
- Production: `environment.prod.ts`

## Tech Stack

- [Angular](https://angular.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase (Auth, DB, Realtime)](https://supabase.com/)
- [Docker](https://www.docker.com/) + [Nginx](https://nginx.org/)
- [AWS EC2](https://aws.amazon.com/ec2/) + ECR Public

## License

This project is licensed under the MIT License

## Development server

Run a local dev server:

```bash
npm start
```

Visit `http://localhost:4200/`. The app reloads on source changes.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

Build the project:

```bash
ng build
```

Artifacts land in `dist/`. The production build is optimized.

## Running unit tests

```bash
ng test
```

## Running end-to-end tests

```bash
ng e2e
```

Choose and configure your preferred e2e framework.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

Made with ❤️ from therama.dev

## Release Notes

See `CHANGELOG.md` for detailed release notes. Latest: `2.3.0` adds a reusable logo component, fixes profile picture cropping, and improves state management.
