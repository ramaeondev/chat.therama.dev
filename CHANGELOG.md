# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [2.2.0] - 2025-09-23

### Added
- User avatar enhancements:
  - Added online/offline status indicator dot
  - Implemented deterministic background color palette based on user ID or name hash
  - Added support for consistent colors across the application for the same user
  - Improved performance with OnPush change detection

## [2.1.0] - 2025-09-23

### Added
- Profile dialog with circular avatar cropper using `ngx-image-cropper`.
- Improved header: larger logo and title/subtitle next to it.

### Changed
- What’s New dialog now loads from `assets/CHANGELOG.md` (fixes 404 in production).
- CI workflow copies root `CHANGELOG.md` into `src/assets/CHANGELOG.md` during build so it is served at `/assets/CHANGELOG.md`.

### Security
- Avatar uploads go to the private Storage bucket (`chat.therama.dev`) and the profile is updated with a signed URL.


## [2.0.0] - 2025-09-23

### Added
- Full emoji support via `emoji-picker-element` wrapped in a standalone Angular component `src/app/shared/emoji-picker/emoji-picker.ts`.
- File and image attachments in chats:
  - Client-side validations: 1 MB max size and restricted MIME allowlist.
  - Private Supabase Storage integration using bucket `chat.therama.dev`.
  - Messages store only the storage `path` in `messages.content` as JSON payload `{ type: 'attachment', path, name, mime, text? }` (no DB schema change).
  - Signed URLs are generated on demand when rendering messages.
  - Inline rendering for image MIME types; non-images render as downloadable links.
- Friendly last-message preview for attachments in the friends list (shows a 📎 label).

### Changed
- Bumped application version to `2.0.0` in `package.json`.
- Updated `src/app/core/supabase.service.ts`:
  - `uploadAttachment(file)` now uploads to private bucket `chat.therama.dev` and returns the storage path.
  - `sendAttachmentMessage(friendId, meta)` now stores attachment payload with `path`.
  - `getSignedUrl(path, expiresInSeconds)` added for runtime URL signing.
- Updated `src/app/feature/dashboard/dashboard.ts` and `.html`:
  - Extended message model to support attachments.
  - Added emoji picker UI and handlers.
  - Added upload button, `accept` list, validations, and user-facing errors.
  - Resolves signed URLs on initial load, send, and realtime subscription.

### Security
- Storage bucket is private. Access controlled via RLS policies on `storage.objects` scoped to `${auth.uid()}/...` prefixes.
- No public object URLs are stored; signed URLs are short-lived and generated per render.

### Migration/Setup Notes
- Create a private Storage bucket named `chat.therama.dev`.
- Apply RLS policies for insert/select/update/delete for the bucket and path prefix `${auth.uid()}/...`.
- Ensure environment variables for Supabase URL/key are configured.

## [1.x] - 2025-09-xx
- Initial real-time chat app with presence, smart friends list, OTP auth, and Dockerized deployment.

