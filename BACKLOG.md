# Backlog

## Signed URL reliability
- Periodically refresh signed URLs for attachments (every 30–60 minutes)
- Retry once on image load error to re-sign an expired URL
- Code refs:
  - `src/app/feature/dashboard/dashboard.ts`: `startSignedUrlRefresh`, `onAttachmentImageError`
  - `src/app/core/supabase.service.ts`: `getSignedUrl`

Command to create issue:
```
gh issue create --title "Signed URL: periodic refresh and retry on error" --body "Implement periodic refresh (every 30–60 min) of signed URLs for attachments and retry-on-error for expired image links. Code: src/app/feature/dashboard/dashboard.ts (startSignedUrlRefresh, onAttachmentImageError), src/app/core/supabase.service.ts (getSignedUrl). Acceptance: attachments still render after long sessions without reload."
```

## Drag-and-drop uploader
- Visible drop zone around composer
- Same validation as click-upload (1MB max, MIME allowlist)
- Code refs:
  - `src/app/feature/dashboard/dashboard.ts`: `onDragOver`, `onDragLeave`, `onDrop`, `handleFileUpload`
  - `src/app/feature/dashboard/dashboard.html`: form `(dragover) (dragleave) (drop)`, dashed border UI

Command to create issue:
```
gh issue create --title "Drag-and-drop uploader for attachments" --body "Add drop zone to the composer with the same validation as click-upload (1MB max, MIME allowlist). Code: dashboard.html (.drag bindings) and dashboard.ts (onDragOver, onDragLeave, onDrop, handleFileUpload). Acceptance: drop file to upload and send with caption."
```

## Upload progress bar
- Show progress indicator while uploading
- Currently implemented as indeterminate bar; can be upgraded to tracked progress later

Command to create issue:
```
gh issue create --title "Upload progress bar" --body "Show progress during file uploads and disable send accordingly. Start with indeterminate progress bar; future: switch to tracked progress if needed."
```

## Centralize upload limits and MIME list
- Move `MAX_UPLOAD_BYTES` and `ACCEPTED_MIME_LIST` to environments or a config service

Command to create issue:
```
gh issue create --title "Centralize upload limits and mime allowlist" --body "Move MAX_UPLOAD_BYTES and ACCEPTED_MIME_LIST to environments or a config service. Acceptance: single source of truth for limits without touching component code."
```

# Story: Update Dashboard Header with Profile Menu, Avatar, and Changelog Dialog

**Story Description**  
As a **user**, I want a clear and accessible profile menu in the dashboard header so that I can update my name, manage my profile picture, view “What’s New” (changelog), and log out easily.

---

## Acceptance Criteria

### 1. Header Layout
- The dashboard header should display the logo (properly scaled, not tiny).
- On the right side of the header, show an avatar button that opens a dropdown menu.
- If a user has a profile picture → show the picture in a round avatar.
- If no profile picture:  
  - Show initials generated from the user’s name.  
  - Multi-word names → use the first letter of the first two words.  
  - Single-word names → use the first two letters.

### 2. Dropdown Menu Items
- The avatar dropdown should include:
  - **My Profile**
  - **What’s New**
  - **Logout**

### 3. My Profile (Dialog)
- Clicking **My Profile** opens a dialog.
- Dialog includes fields:
  - First Name (**required, cannot be empty**)
  - Last Name (**optional**)
  - Profile Picture upload (round avatar preview).
- User can crop and upload a profile picture.
- Buttons:
  - **Save** → updates profile info.
  - **Cancel** → closes dialog without changes.

### 4. What’s New (Dialog)
- Clicking **What’s New** opens a centered modal dialog.
- Content displays the contents of `changelog.md`.
- Dialog includes a **Close** button.

### 5. Logout
- Clicking **Logout** signs the user out and redirects them to the login screen.

---

## Technical Notes
- Use Angular Material `mat-menu` for avatar dropdown.
- Use Angular Material `mat-dialog` for profile and changelog dialogs.
- Implement image cropping and circular preview for profile picture upload.
- Validation: first name cannot be empty.
- Avatar initials should be dynamically generated based on user name.

---

## Definition of Done (DoD)
- Logo is visible and correctly scaled in header.
- Avatar dropdown menu appears with **My Profile**, **What’s New**, and **Logout**.
- Profile dialog supports name update, avatar upload, cropping, and validation.
- What’s New dialog displays `changelog.md` content.
- Logout functionality works correctly.
- Unit tests for avatar initials generation and profile validation.
- Code reviewed, tested, and merged into main branch.
