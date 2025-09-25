# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [4.0.0] - 2025-09-26

### Added
- Implemented Delete Account functionality in My Profile dialog
- Added confirmation flow requiring explicit user confirmation
- Added progress and success notifications during account deletion process

### Fixed
- Fixed profile picture save button to not close dialog
- Fixed name save button to not close dialog
- Fixed Delete Account functionality to properly delete user data
- Improved error handling for account management operations

## [3.1.0] - 2025-09-25

### Security
- Enhanced file storage security with improved access control policies
- Implemented conversation-based file access restrictions
- Updated storage path structure to enforce proper access boundaries
- Fixed file sharing permissions to ensure only conversation participants can access shared files

### Changed
- Updated file storage implementation to use strict folder hierarchy
- Modified upload methods to support secure file paths
- Improved error handling for file operations

## [3.0.0] - 2025-09-23

### Added
- **Complete Landing Page Experience**:
  - Beautiful, responsive landing page at root URL (`/`)
  - Dynamic feature showcase with JSON-driven content
  - Professional hero section with animated gradient text
  - Statistics display showing feature counts and progress
  - Recent updates section with version information
  - Technology stack showcase
  - Call-to-action sections with smooth transitions

- **Enhanced Features Documentation**:
  - Comprehensive `features.json` with all current and planned features
  - Dynamic loading of features data via HttpClient service
  - Structured feature categories (Authentication, Messaging, Presence, etc.)
  - Version history and roadmap information

- **Improved User Experience**:
  - Smooth loading states and error handling
  - Professional footer component integration
  - Consistent branding with LogoComponent
  - Mobile-responsive design throughout
  - Beautiful animations and hover effects

### Fixed
- **Gradient Text Rendering**:
  - Fixed blurred gradient text with optimized CSS
  - Multiple fallback strategies for cross-browser compatibility
  - Clean, crisp text rendering with anti-aliasing
  - Removed CSS conflicts causing visual artifacts

- **HttpClient Provider Setup**:
  - Added HttpClient provider to app configuration
  - Fixed standalone component dependency injection
  - Proper service architecture for data loading

### Changed
- **Application Architecture**:
  - Moved to version 3.0.0 for major landing page release
  - Enhanced component structure with better separation of concerns
  - Improved CSS organization and reduced conflicts
  - Better error handling and user feedback

- **Styling Improvements**:
  - Clean, professional design system
  - Consistent color palette and typography
  - Optimized animations and transitions
  - Better accessibility and focus states

## [2.3.0] - 2025-09-23

### Added
- New reusable LogoComponent for consistent branding across the application:
  - Extracted QuickChat branding into a standalone component
  - Configurable subtitle support
  - Used in dashboard, login, and signup components

### Fixed
- Profile picture upload and cropping functionality:
  - Fixed event handling for ngx-image-cropper v9 compatibility
  - Improved error handling and debugging for crop operations
  - Fixed state management when canceling cropping process
  - Enhanced CSS styling for better cropper display

### Changed
- Improved state management in profile dialog:
  - Proper cleanup of temporary cropping state
  - Consistent error handling across all crop operations
  - Better user feedback for upload and cropping processes

### Added
- New reusable LogoComponent for consistent branding across the application:
  - Extracted QuickChat branding into a standalone component
  - Configurable subtitle support
  - Used in dashboard, login, and signup components

### Fixed
- Profile picture upload and cropping functionality:
  - Fixed event handling for ngx-image-cropper v9 compatibility
  - Improved error handling and debugging for crop operations
  - Fixed state management when canceling cropping process
  - Enhanced CSS styling for better cropper display

### Changed
- Improved state management in profile dialog:
  - Proper cleanup of temporary cropping state
  - Consistent error handling across all crop operations
  - Better user feedback for upload and cropping processes

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

