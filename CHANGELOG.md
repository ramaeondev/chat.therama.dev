# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [3.4.1] - 2025-09-27

### Changed
- **Header Component Refactor**:
  - Decoupled header component from parent events
  - Moved logout and profile management logic into the header component
  - Improved admin dashboard navigation with toggle functionality
  - Added proper error handling and user feedback with snackbar notifications

### Fixed
- **Admin Dashboard**:
  - Fixed DatePipe provider error in admin dashboard
  - Improved error handling for profile updates
  - Removed console.log statements for cleaner production code

## [3.4.0] - 2025-09-27

### Added
- **Enhanced User Profile**:
  - Added email display in user profile
  - Included last sign-in timestamp with proper formatting
  - Added member since date to show account creation date
  - Improved layout and organization of profile information

### Changed
- **Direct Data Fetching**:
  - Profile dialog now fetches user data directly from Supabase
  - Removed prop drilling through multiple components
  - Improved component independence and reusability

### Fixed
- **Bug Fixes**:
  - Fixed DatePipe injection issues in Dashboard component
  - Resolved template binding issues in profile dialog
  - Fixed duplicate field display in profile view
  - Improved error handling for data fetching

### Technical
- Refactored ProfileDialogComponent to use Angular signals
- Updated component templates to use modern Angular syntax
- Improved error handling and loading states

## [3.3.0] - 2025-09-26

### Added
- **Modern Authentication UI**:
  - Complete redesign of signup and signin components with glassmorphism effects
  - Enhanced form validation with real-time feedback and better error handling
  - Improved OTP input with monospace font and character spacing for better UX
  - Dynamic button spacing that adapts based on form state (OTP visible/hidden)

- **Enhanced Landing Page**:
  - Redesigned hero section with animated background elements and gradient text effects
  - Added version badge with pulse animation in hero section
  - Enhanced features grid with hover animations and improved card design
  - Modernized stats section with gradient backgrounds and interactive elements
  - Improved call-to-action section with compelling copy and enhanced styling
  - Added trust indicators (Free to use, No setup required, Secure & private)

- **Visual Design System**:
  - Consistent color schemes across components (blue/purple for signup, green/teal for signin)
  - Modern glassmorphism effects with backdrop blur throughout the application
  - Smooth animations and transitions for better user experience
  - Professional gradient backgrounds and enhanced shadow effects
  - Improved accessibility with proper contrast and focus states

### Changed
- **Features Documentation**:
  - Updated features.json to version 3.2.0 with comprehensive feature tracking
  - Added new features including Account Deletion, Authentication Guard, and Enhanced Security
  - Updated statistics to reflect 32 total features with 25 implemented
  - Enhanced recently added features section with v3.2.0 and v3.1.0 releases

- **Component Architecture**:
  - Improved responsive design across all authentication and landing page components
  - Enhanced mobile support with better touch targets and spacing
  - Better component organization and consistent styling patterns
  - Optimized animations and transitions for smoother user interactions

### Fixed
- **UI/UX Improvements**:
  - Fixed button spacing issues in authentication flows
  - Improved visual hierarchy and spacing throughout the application
  - Enhanced loading states and user feedback mechanisms
  - Better error message presentation with consistent styling

- **Responsive Design**:
  - Fixed layout issues on mobile devices
  - Improved component spacing and alignment across different screen sizes
  - Enhanced touch-friendly interface elements

## [3.2.0] - 2025-09-26

### Added
- **Delete Account Functionality**:
  - Implemented comprehensive account deletion feature in My Profile dialog
  - Added confirmation flow requiring explicit user confirmation with "DELETE" text input
  - Added progress and success notifications during account deletion process
  - Implemented complete data cleanup: messages, attachments, avatar files, and profile data

- **Authentication Guard**:
  - Added route protection for dashboard with `authGuard`
  - Ensures only authenticated users can access the dashboard

- **Enhanced User Experience**:
  - Inline save buttons in profile dialog (save button next to name field)
  - Improved responsive design across all components
  - Better mobile support with flexible layouts and proper overflow handling
  - Enhanced emoji picker with better sizing and scrolling capabilities

### Fixed
- **Profile Dialog Improvements**:
  - Fixed profile picture save button to not close dialog unexpectedly
  - Fixed name save button to not close dialog unexpectedly
  - Improved error handling for account management operations
  - Better user feedback during save operations

- **Dashboard Responsiveness**:
  - Fixed overflow issues in chat area and messages list
  - Improved mobile layout with proper flex wrapping
  - Enhanced drop zone styling and responsiveness
  - Better handling of long content in dialogs

- **UI/UX Enhancements**:
  - Removed footer component from dashboard for cleaner interface
  - Improved What's New dialog with better responsive design
  - Enhanced button layouts and spacing throughout the application

### Changed
- **Application Architecture**:
  - Updated version from 4.0.0 to 3.2.0 in package.json
  - Restructured profile dialog component for better usability
  - Improved component organization and signal-based state management
  - Enhanced error handling and user feedback systems

### Security
- **Account Deletion Security**:
  - Implemented secure account deletion with proper data cleanup
  - Added confirmation requirements to prevent accidental deletions
  - Proper cleanup of user data from all database tables and storage
  - Secure sign-out process after account deletion

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

