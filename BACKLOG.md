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

## Notifications System
- Implement push notifications for new messages when app is in background
- Add in-app notification center to view recent notifications
- Support for different notification types (new message, friend request, etc.)
- Notification settings/preferences page
- Code refs:
  - `src/app/core/notifications/` (new directory)
  - `src/app/feature/notifications/` (new components)
  - Service Worker updates for push notifications

Command to create issue:
```
gh issue create --title "Implement Notifications System" --body "Add push notifications and in-app notification center. Includes: service worker registration, notification permissions, in-app notification UI, and user preferences. Code: New modules in src/app/core/notifications/ and src/app/feature/notifications/. Acceptance: Users receive and can view notifications when app is in background."
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


# Story: Chat Management Options (Archive, Block, Remove)

**Story Description**  
As a **user**, I want to manage my chats with friends using a kebab menu so that I can archive, block, or remove conversations for myself or both users, giving me more control over my chat experience.

---

## Acceptance Criteria

### 1. Kebab Menu (⋮)
- Each friend in the chat list should have a kebab menu (3 vertical dots).
- Clicking the menu shows the options:
  - **Archive Chat**
  - **Block User**
  - **Remove Chat (For Me)**
  - **Remove Chat (For Both Users)**

### 2. Archive Chat
- Moves the chat to an "Archived" section (hidden from main list).
- Chat can be unarchived later.
- No messages are deleted.

### 3. Block User
- Blocks the selected friend.
- Blocked users cannot send new messages.
- Existing history remains unless removed.
- Option to unblock later.

### 4. Remove Chat (For Me)
- Removes the chat only from the current user’s chat list.
- Does not affect the other user’s chat history.

### 5. Remove Chat (For Both Users)
- Permanently deletes chat history for both users.
- Confirmation prompt required before action.

---

## Technical Notes
- Use a kebab menu UI component for chat management options.
- Maintain audit log of actions (archive, block, remove).
- Backend should differentiate between:
  - **Soft actions:** archive, remove for self.
  - **Hard actions:** block, remove for both.
- Ensure blocked users cannot bypass by starting a new chat.

---

## Definition of Done (DoD)
- Kebab menu visible for each friend in the chat list.
- Options (Archive, Block, Remove for me, Remove for both) available and functional.
- Archive works with unarchive option.
- Block/unblock logic prevents new messages from blocked users.
- Remove chat for self hides chat only from that user.
- Remove chat for both deletes permanently with confirmation.
- Unit tests implemented for all scenarios.
- Code reviewed, tested, and merged.

---

## Subtasks
- [ ] Add kebab menu (⋮) to each friend in chat list.
- [ ] Implement **Archive Chat** functionality (with unarchive).
- [ ] Implement **Block/Unblock User** logic.
- [ ] Implement **Remove Chat (For Me)** functionality.
- [ ] Implement **Remove Chat (For Both Users)** with confirmation dialog.
- [ ] Backend support for archive/block/remove actions.
- [ ] Unit tests for all actions.


# Story: Delete Account Option in My Profile

**Story Description**  
As a **user**, I want to permanently delete my account and all associated records from the system so that none of my personal data remains. The system should notify me of the process and its irreversibility.

---

## Acceptance Criteria

### 1. Delete Account Option
- Add a **Delete Account** button inside the **My Profile** dialog/page.
- Clicking triggers a **confirmation alert**:
  - Warns the user about permanent data deletion.
  - Explains that **all records across all Supabase tables will be deleted**.
  - States that the action is **irreversible** and nothing can be recovered.

### 2. Confirmation Flow
- User must explicitly confirm deletion (e.g., typing **DELETE** or pressing **Confirm** in a modal).
- Once confirmed:
  - Trigger a backend Supabase function to delete all user-related records from all tables.
  - Ensure relational dependencies (foreign keys, cascading deletes) are respected.
- Show a progress/alert message:
  - “This process may take up to X minutes depending on your data size.”
  - “You will be notified once deletion is complete.”

### 3. Notifications
- After deletion, user is automatically logged out.
- User receives a **final notification** (e.g., email or in-app alert before logout):
  - “Your account and all associated data have been successfully deleted.”

---

## Technical Notes
- Implement a Supabase function (`delete_user_account`) to handle:
  - Cascading deletes across all tables referencing the user.
  - Deletion of storage bucket files (avatars, uploads, etc.).
  - Removal of authentication user record from `auth.users`.
- Ensure GDPR/Privacy compliance (irreversible deletion).
- Use Supabase Row Level Security (RLS) to prevent unauthorized access during deletion.
- Consider **background job** if deletion is time-consuming (Supabase Edge Function + queue).

---

## Definition of Done (DoD)
- Delete Account button available in My Profile.
- User warned about irreversibility and time required for data wipe.
- User must confirm before deletion proceeds.
- All user-related records removed from Supabase tables and storage.
- User is logged out after deletion.
- Final notification (UI/email) confirms deletion.
- Unit tests for delete flow, including:
  - Confirmation validation.
  - Successful deletion.
  - Preventing accidental deletion.

---

## Subtasks
- [ ] Add **Delete Account** button in My Profile dialog/page.
- [ ] Build confirmation modal with warnings and irreversible notice.
- [ ] Implement Supabase function (`delete_user_account`) for full data wipe.
- [ ] Ensure deletion of Supabase storage files (avatars, uploads, etc.).
- [ ] Auto logout user after deletion completes.
- [ ] Add email/notification confirmation once deletion is complete.
- [ ] Write unit/integration tests for delete account flow.

## End-to-end chat encryption
- Implement client-side encryption for messages before sending to Supabase
- Use Web Crypto API for encryption/decryption
- Generate and manage encryption keys per conversation
- Ensure messages are encrypted in transit and at rest
- Add UI indicators for encrypted conversations
- Code refs:
  - `src/app/core/crypto.service.ts`: encryption/decryption utilities
  - `src/app/feature/dashboard/dashboard.ts`: key management and message encryption
  - `src/app/core/supabase.service.ts`: encrypted message handling

Command to create issue:
```
gh issue create --title "End-to-end chat encryption" --body "Implement client-side encryption for all messages using Web Crypto API. Generate keys per conversation, encrypt messages before sending to Supabase. Code: crypto.service.ts (encryption utils), dashboard.ts (key management), supabase.service.ts (encrypted message handling). Acceptance: messages encrypted in transit and at rest, UI shows encryption status."
```
