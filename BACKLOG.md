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
