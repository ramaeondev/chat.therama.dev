import { Component, OnDestroy, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder, FormGroup } from '@angular/forms';
import { signal } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { Router } from '@angular/router';
import { UserMetadata } from '@supabase/supabase-js';
import { FooterComponent } from '../../shared/footer/footer';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FooterComponent],
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
  messages = signal<Array<{ id?: string; from: 'me' | 'them'; text: string; at: Date }>>([]);
  private _messageIds = new Set<string>();
  private _unsubscribe: (() => void) | null = null;
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

  constructor(private supabase: SupabaseService, private router: Router, private fb: NonNullableFormBuilder) {
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

  async initialize() {
    await this.supabase.upsertProfileFromAuth();
    await this.loadFriends();
    const first = this.friends()[0];
    if (first) {
      this.selectFriend(first.id);
    }
    // Setup presence after ensuring we have a user
    await this.setupPresence();
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
      return {
        id,
        from: r.sender_id === myId ? 'me' : 'them',
        text: r.content as string,
        at: new Date(r.created_at),
      } as const;
    });
    this.messages.set(mapped);
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
      this.messages.update((arr) => [
        ...arr,
        { id, from: row.sender_id === myId ? 'me' : 'them', text: row.content, at: new Date(row.created_at) },
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
      // If this message is for the currently selected friend, append (dedupe first)
      if (this.selectedFriendId() === otherId) {
        if (!this._messageIds.has(id)) {
          this._messageIds.add(id);
          this.messages.update((arr) => [
            ...arr,
            { id, from: row.sender_id === myId ? 'me' : 'them', text: row.content, at: new Date(row.created_at) },
          ]);
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
  }
}
