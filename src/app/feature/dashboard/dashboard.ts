import { Component, OnDestroy, WritableSignal, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder, FormGroup } from '@angular/forms';
import { signal } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { SupabaseService } from '../../core/supabase.service';
import { Router } from '@angular/router';
import { UserMetadata } from '@supabase/supabase-js';
import { FooterComponent } from '../../shared/footer/footer';
import { EmojiPickerComponent } from '../../shared/emoji-picker/emoji-picker';
import { HttpClient } from '@angular/common/http';
import { UserAvatarComponent } from '../../shared/user-avatar/user-avatar';
import { ProfileDialogComponent } from '../../shared/profile-dialog/profile-dialog';
import { LogoComponent } from '../../shared/logo/logo';
import { NotificationToggleComponent } from '../../shared/components/notification-toggle/notification-toggle.component';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FooterComponent, 
    EmojiPickerComponent, 
    UserAvatarComponent,
    ProfileDialogComponent,
    LogoComponent,
    NotificationToggleComponent,
    ClickOutsideDirective
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnDestroy {
  // Top bar state
  userEmail = signal<string>('');
  loggingOut = signal<boolean>(false);

  // Friends and chat state
  friends = signal<Array<{
    id: string;
    name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    last_message_at?: string | null;
    last_message_text?: string | null;
    last_message_from_me?: boolean | null;
  }>>([]);
  selectedFriendId = signal<string | null>(null);
  messages = signal<Array<{
    id?: string;
    from: 'me' | 'them';
    at: Date;
    text?: string;
    attachment?: { path: string; name: string; mime: string; text?: string; url?: string };
  }>>([]);
  private _messageIds = new Set<string>();
  private _unsubscribe: (() => void) | null = null;
  private notificationService = inject(NotificationService);
  user: WritableSignal<UserMetadata | null> = signal<UserMetadata | null>(null);

  // Presence / realtime status
  onlineIds = signal<string[]>([]);
  realtimeConnected = signal<boolean>(false);
  private _unsubPresence: (() => void) | null = null;

  // Email search state
  searchEmail = signal<string>('');
  searching = signal<boolean>(false);
  searchError = signal<string>('');

  messageForm!: FormGroup;
  // UI state
  showEmoji = signal<boolean>(false);
  uploading = signal<boolean>(false);
  uploadError = signal<string>('');
  dragging = signal<boolean>(false);
  uploadProgress = signal<number>(0); // 0..100

  // Topbar profile/menu/dialog state
  showMenu = signal<boolean>(false);
  showProfileDialog = signal<boolean>(false);
  showWhatsNewDialog = signal<boolean>(false);
  profileName = signal<string>('');
  profileAvatarUrl = signal<string | null>(null);
  changelog = signal<string>('');

  // Sidebar visibility state
  showSidebar = signal<boolean>(true);

  toggleSidebar() {
    this.showSidebar.set(!this.showSidebar());
  }

  // File restrictions (mirror Supabase bucket policies/settings)
  readonly MAX_UPLOAD_BYTES = 1 * 1024 * 1024; // 1 MB
  readonly ACCEPTED_MIME_LIST = [
    'image/jpeg','image/png','image/gif','image/webp','image/svg+xml','image/x-icon','image/bmp','image/tiff','image/heic','image/heif',
    'video/mp4','video/webm','video/ogg','video/x-msvideo','video/quicktime','video/mpeg','video/3gpp','video/x-matroska','video/x-ms-wmv',
    'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip','application/x-rar-compressed','application/x-7z-compressed','application/gzip',
    'text/plain','text/csv','application/json'
  ];

  constructor(private supabase: SupabaseService, private router: Router, private fb: NonNullableFormBuilder, private http: HttpClient) {
    // Load current session to show email
    this.supabase.getSession().then((session) => {
      const email = session?.user?.email ?? '';
      this.userEmail.set(email);
      this.user.set(session?.user?.user_metadata ?? null);
    });

    // Ensure profile exists and then load friends
    this.initialize();

    // Initialize reactive form here to avoid using fb before it's set
    this.messageForm = this.fb.group({
      text: ['', [Validators.required]],
    });
  }

  // --- Topbar avatar menu & dialogs ---
  @ViewChild('profileMenuButton') profileMenuButton!: ElementRef;
  
  toggleMenu(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.showMenu.update(prev => !prev);
  }

  onProfileClickOutside(event: Event) {
    // Only close if the click is outside the menu and not on the toggle button
    const target = event.target as HTMLElement;
    const isClickOnButton = this.profileMenuButton?.nativeElement.contains(target);
    
    if (!isClickOnButton) {
      this.showMenu.set(false);
    }
  }

  
  openProfile() {
    this.showMenu.set(false);
    this.showProfileDialog.set(true);
  }
  
  openWhatsNew() {
    this.showMenu.set(false);
    this.showWhatsNewDialog.set(true);
    this.loadChangelog();
  }
  
  closeDialogs() {
    this.showProfileDialog.set(false);
    this.showWhatsNewDialog.set(false);
  }
  
  async saveProfile(profileData: { name: string; avatarFile?: File }) {
    console.log('Saving profile with data:', profileData);
    try {
      // Update name if changed
      if (profileData.name !== this.profileName()) {
        console.log('Updating profile name from:', this.profileName(), 'to:', profileData.name);
        await this.supabase.updateProfileName(profileData.name);
        this.profileName.set(profileData.name);
      }
      
      // Handle avatar upload if a new file is provided
      if (profileData.avatarFile) {
        console.log('Uploading avatar file:', {
          name: profileData.avatarFile.name,
          type: profileData.avatarFile.type,
          size: profileData.avatarFile.size,
          sizeMB: (profileData.avatarFile.size / 1024 / 1024).toFixed(2)
        });
        const res = await this.supabase.uploadAvatar(profileData.avatarFile, true);
        console.log('Upload result:', res);
        this.profileAvatarUrl.set(res.url);
      }
      
      this.showProfileDialog.set(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  }
  
  async removeProfilePicture() {
    try {
      await this.supabase.removeAvatar();
      this.profileAvatarUrl.set(null);
    } catch (error) {
      console.error('Error removing profile picture:', error);
      alert('Failed to remove profile picture. Please try again.');
    }
  }
  async loadChangelog() {
    try {
      const text = await this.http.get('assets/CHANGELOG.md', { responseType: 'text' }).toPromise();
      this.changelog.set(text || '');
    } catch {
      this.changelog.set('No release notes available.');
    }
  }
  onProfileNameInput(event: Event) {
    const t = event.target as HTMLInputElement | null;
    this.profileName.set((t?.value || '').trimStart());
  }

  // --- Attachments & Emojis ---
  addEmoji(emoji: string) {
    const control = this.messageForm.get('text');
    const current = (control?.value as string) ?? '';
    control?.setValue(current + emoji);
  }

  onEmojiSelected(emoji: string) {
    this.addEmoji(emoji);
    this.showEmoji.set(false);
  }

  onEmojiClosed() {
    this.showEmoji.set(false);
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files && input.files[0];
    if (!file) return;
    const friendId = this.selectedFriendId();
    if (!friendId) return;
    try {
      this.uploadError.set('');
      // Validate size
      if (file.size > this.MAX_UPLOAD_BYTES) {
        this.uploadError.set(`File is too large. Max size is ${(this.MAX_UPLOAD_BYTES/1024/1024).toFixed(0)} MB.`);
        return;
      }
      // Validate MIME
      const mime = (file.type || '').toLowerCase();
      if (!this.ACCEPTED_MIME_LIST.includes(mime)) {
        this.uploadError.set('This file type is not allowed.');
        return;
      }
      this.uploading.set(true);
      this.uploadProgress.set(0);
      const { path } = await this.supabase.uploadAttachmentWithProgress(file, friendId, (pct) => this.uploadProgress.set(pct));
      const caption = (this.messageForm.getRawValue().text || '').trim();
      const row = await this.supabase.sendAttachmentMessage(friendId, {
        path,
        name: file.name,
        mime: mime || 'application/octet-stream',
        text: caption || undefined,
      });
      const id = String(row.id);
      if (!this._messageIds.has(id)) {
        this._messageIds.add(id);
        const myId = await this.supabase.getUserId();
        const parsed = this.parseMessageContent(row.content as string);
        this.messages.update((arr) => [
          ...arr,
          { id, from: row.sender_id === myId ? 'me' : 'them', at: new Date(row.created_at), ...parsed },
        ]);
        if (parsed.attachment?.path) {
          this.enrichAttachmentUrl(id, parsed.attachment.path);
        }
      }
      // Clear caption after sending attachment
      this.messageForm.reset({ text: '' });
      await this.refreshFriendMeta(friendId);
    } catch (e) {
      console.error('Failed to upload/send attachment', e);
      this.uploadError.set('Upload failed. Please try again.');
      // Optional: surface to UI via a toast/snackbar
    } finally {
      this.uploading.set(false);
      this.uploadProgress.set(0);
      if (input) input.value = '';
    }
  }

  isImageMime(mime: string) {
    return /^image\//.test(mime);
  }

  private parseMessageContent(content: string): { text?: string; attachment?: { path: string; name: string; mime: string; text?: string } } {
    // Try to parse JSON payloads for attachments; fallback to plain text
    try {
      const obj = JSON.parse(content);
      if (obj && obj.type === 'attachment' && obj.path && obj.name && obj.mime) {
        return { attachment: { path: obj.path, name: obj.name, mime: obj.mime, text: obj.text || '' } };
      }
      // If JSON but not recognized, show raw stringified content
      return { text: content };
    } catch {
      return { text: content };
    }
  }

  private async enrichAttachmentUrl(messageId: string, path: string) {
    try {
      const url = await this.supabase.getSignedUrl(path);
      this.messages.update((arr) => arr.map(m => {
        if (m.id === messageId && m.attachment && m.attachment.path === path) {
          return { ...m, attachment: { ...m.attachment, url } };
        }
        return m;
      }));
    } catch (e) {
      console.error('Failed to sign URL for attachment', e);
    }
  }

  // Retry logic on image error (e.g., expired URL): re-sign once
  private _retrySet = new Set<string>();
  onAttachmentImageError(messageId: string) {
    const key = messageId;
    if (this._retrySet.has(key)) return; // avoid infinite retries
    this._retrySet.add(key);
    const m = this.messages().find(mm => mm.id === messageId);
    if (m?.attachment?.path) {
      this.enrichAttachmentUrl(messageId, m.attachment.path);
      // Clear retry flag after a short delay to allow a future retry if needed
      setTimeout(() => this._retrySet.delete(key), 60_000);
    }
  }

  // Periodically refresh signed URLs for visible messages
  private _refreshHandle: any;
  startSignedUrlRefresh(intervalMs = 30 * 60 * 1000) { // 30 minutes
    if (this._refreshHandle) clearInterval(this._refreshHandle);
    this._refreshHandle = setInterval(() => {
      const current = this.messages();
      for (const m of current) {
        if (m.id && m.attachment?.path) {
          this.enrichAttachmentUrl(m.id, m.attachment.path);
        }
      }
    }, intervalMs);
  }

  // --- Drag & Drop ---
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(true);
  }
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
  }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Process only the first file for now; can be extended to multiple
      const f = files[0];
      // Reuse validation and upload path via a helper
      this.handleFileUpload(f);
    }
  }

  private async handleFileUpload(file: File) {
    const friendId = this.selectedFriendId();
    if (!friendId) return;
    try {
      this.uploadError.set('');
      if (file.size > this.MAX_UPLOAD_BYTES) {
        this.uploadError.set(`File is too large. Max size is ${(this.MAX_UPLOAD_BYTES/1024/1024).toFixed(0)} MB.`);
        return;
      }
      const mime = (file.type || '').toLowerCase();
      if (!this.ACCEPTED_MIME_LIST.includes(mime)) {
        this.uploadError.set('This file type is not allowed.');
        return;
      }
      this.uploading.set(true);
      const { path } = await this.supabase.uploadAttachment(file, friendId);
      const caption = (this.messageForm.getRawValue().text || '').trim();
      const row = await this.supabase.sendAttachmentMessage(friendId, {
        path,
        name: file.name,
        mime: mime || 'application/octet-stream',
        text: caption || undefined,
      });
      const id = String(row.id);
      if (!this._messageIds.has(id)) {
        this._messageIds.add(id);
        const myId = await this.supabase.getUserId();
        const parsed = this.parseMessageContent(row.content as string);
        this.messages.update((arr) => [
          ...arr,
          { id, from: row.sender_id === myId ? 'me' : 'them', at: new Date(row.created_at), ...parsed },
        ]);
        if (parsed.attachment?.path) {
          this.enrichAttachmentUrl(id, parsed.attachment.path);
        }
      }
      this.messageForm.reset({ text: '' });
      await this.refreshFriendMeta(friendId);
    } catch (e) {
      console.error('Failed to upload/send attachment', e);
      this.uploadError.set('Upload failed. Please try again.');
    } finally {
      this.uploading.set(false);
      this.uploadProgress.set(0);
    }
  }

  async initialize() {
    await this.supabase.upsertProfileFromAuth();
    await this.loadMyProfile();
    await this.loadFriends();
    const first = this.friends()[0];
    if (first) {
      this.selectFriend(first.id);
    }
    // Setup presence after ensuring we have a user
    await this.setupPresence();
    // Kick off periodic refresh of signed URLs
    this.startSignedUrlRefresh();
  }

  private async loadMyProfile() {
    const me = await this.supabase.getMyProfile();
    if (me) {
      this.profileName.set((me.name || '').trim());
      this.profileAvatarUrl.set(me.avatar_url);
    }
  }

  async loadFriends() {
    const list = await this.supabase.listFriendsSmartWithMeta();
    this.friends.set(list);
  }

  async selectFriend(id: string) {
    this.selectedFriendId.set(id);
    await this.loadConversation(id);
    this.subscribeToConversation(id);
  }

  async loadConversation(friendId: string) {
    // Clear current messages state
    this.messages.set([]);
    this._messageIds.clear();
    const myId = await this.supabase.getUserId();
    const rows = await this.supabase.listMessages(friendId);
    const mapped = rows.map((r: any) => {
      const id = String(r.id);
      this._messageIds.add(id);
      const parsed = this.parseMessageContent(r.content as string);
      return {
        id,
        from: r.sender_id === myId ? 'me' : 'them',
        at: new Date(r.created_at),
        ...parsed,
      } as const;
    });
    this.messages.set(mapped);
    // Resolve signed URLs for any attachments
    for (const m of mapped) {
      if (m.id && m.attachment?.path) {
        this.enrichAttachmentUrl(m.id, m.attachment.path);
      }
    }
  }

  async sendMessage() {
    if (this.messageForm.invalid) {
      this.messageForm.markAllAsTouched();
      return;
    }
    const text = this.messageForm.getRawValue().text.trim();
    const friendId = this.selectedFriendId();
    if (!text || !friendId) return;
    const row = await this.supabase.sendMessage(friendId, text);
    const id = String(row.id);
    if (!this._messageIds.has(id)) {
      this._messageIds.add(id);
      const myId = await this.supabase.getUserId();
      const parsed = this.parseMessageContent(row.content as string);
      this.messages.update((arr) => [
        ...arr,
        { id, from: row.sender_id === myId ? 'me' : 'them', at: new Date(row.created_at), ...parsed },
      ]);
    }
    this.messageForm.reset({ text: '' });
    // Update last message meta for friend and resort
    await this.refreshFriendMeta(friendId);
  }

  async logout() {
    this.loggingOut.set(true);
    try {
      await this.supabase.signOut();
      this.router.navigate(['/signin']);
    } finally {
      this.loggingOut.set(false);
    }
  }

  subscribeToConversation(friendId: string) {
    // Clean previous subscription
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    const handler = async (row: any) => {
      const id = String(row.id);
      const myId = await this.supabase.getUserId();
      const otherId: string = row.sender_id === myId ? row.receiver_id : row.sender_id;
      const isFromMe = row.sender_id === myId;
      
      // Only show notifications for messages from others
      if (!isFromMe) {
        const friend = this.friends().find(f => f.id === otherId);
        const friendName = friend?.name || friend?.email || 'Someone';
        const messageText = this.parseMessageContent(row.content as string).text || 'Sent an attachment';
        
        // Show notification if not in focus or not viewing this chat
        if (document.visibilityState !== 'visible' || this.selectedFriendId() !== otherId) {
          this.notificationService.showNotification(`${friendName} sent a message`, {
            body: messageText,
            icon: friend?.avatar_url || undefined
          });
        }
      }

      // If this message is for the currently selected friend, append (dedupe first)
      if (this.selectedFriendId() === otherId) {
        if (!this._messageIds.has(id)) {
          this._messageIds.add(id);
          const parsed = this.parseMessageContent(row.content as string);
          this.messages.update((arr) => [
            ...arr,
            { id, from: isFromMe ? 'me' : 'them', at: new Date(row.created_at), ...parsed },
          ]);
          if (parsed.attachment?.path) {
            this.enrichAttachmentUrl(id, parsed.attachment.path);
          }
        }
      }
      // Always refresh friend meta for the other party to re-sort sidebar
      await this.refreshFriendMeta(otherId);
    };
    this._unsubscribe = this.supabase.subscribeToMessages(friendId, handler);
  }

  // Helper for template to display selected friend's name without using arrow functions in template
  friendName(id: string | null): string {
    if (!id) return 'Friend';
    const f = this.friends().find(p => p.id === id);
    return f?.name || f?.email || 'Friend';
  }

  getFriend(id: string | null) {
    if (!id) return undefined;
    return this.friends().find(p => p.id === id);
  }

  private async refreshFriendMeta(friendId: string) {
    // Fetch single friend's meta by getting union with meta and merging this one
    const metaList = await this.supabase.listFriendsSmartWithMeta();
    const updated = metaList.find((p: any) => p.id === friendId);
    if (!updated) return;
    // Merge and resort
    const others = this.friends().filter(f => f.id !== friendId);
    const merged = [updated, ...others];
    merged.sort((a: any, b: any) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return tb - ta;
    });
    this.friends.set(merged as any);
  }

  private normalizeEmail(v: string) {
    return (v || '').trim().toLowerCase();
  }

  onSearchEmail(event: Event) {
    const target = event.target as HTMLInputElement | null;
    this.searchEmail.set(target?.value ?? '');
  }

  async startChatByEmail() {
    this.searchError.set('');
    const email = this.normalizeEmail(this.searchEmail());
    if (!email) {
      this.searchError.set('Enter an email to search');
      return;
    }
    this.searching.set(true);
    try {
      const profile = await this.supabase.findProfileByEmail(email);
      if (!profile) {
        this.searchError.set('No user found with that email');
        return;
      }
      // Ensure they are added as a contact so they appear even before first message
      await this.supabase.addContact(profile.id);
      if (!this.friends().some(f => f.id === profile.id)) {
        this.friends.update(list => [{ id: profile.id, name: profile.name, email: profile.email, avatar_url: profile.avatar_url }, ...list]);
      }
      await this.selectFriend(profile.id);
      this.searchEmail.set('');
    } catch (e: any) {
      this.searchError.set(e?.message || 'Failed to search');
    } finally {
      this.searching.set(false);
    }
  }

  private async setupPresence() {
    const myId = await this.supabase.getUserId();
    const me = this.user();
    if (!myId) return;
    // Clean previous presence
    if (this._unsubPresence) {
      this._unsubPresence();
      this._unsubPresence = null;
    }
    const meta = { name: (me as any)?.name ?? null, email: this.userEmail() };
    this._unsubPresence = this.supabase.presenceJoin(
      'global',
      myId,
      meta,
      (channel) => {
        // On sync, compute online IDs from presence state
        // presenceState returns { [key: string]: Array<meta> }
        // Keys are the user IDs we used when tracking
        const state = (channel as any).presenceState?.() || {};
        const ids = Object.keys(state);
        this.onlineIds.set(ids);
        this.realtimeConnected.set(true);
      }
    );
  }

  ngOnDestroy(): void {
    if (this._unsubscribe) this._unsubscribe();
    if (this._unsubPresence) this._unsubPresence();
    if (this._refreshHandle) clearInterval(this._refreshHandle);
    this.notificationService.ngOnDestroy();
  }
}
