import { Component, OnDestroy, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder, FormGroup } from '@angular/forms';
import { signal } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { Router } from '@angular/router';
import { UserMetadata } from '@supabase/supabase-js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnDestroy {
  // Top bar state
  userEmail = signal<string>('');
  loggingOut = signal<boolean>(false);

  // Friends and chat state
  friends = signal<Array<{ id: string; name?: string | null; email?: string | null }>>([]);
  selectedFriendId = signal<string | null>(null);
  messages = signal<Array<{ id?: string; from: 'me' | 'them'; text: string; at: Date }>>([]);
  private _messageIds = new Set<string>();
  private _unsubscribe: (() => void) | null = null;
  user: WritableSignal<UserMetadata | null> = signal<UserMetadata | null>(null);

  messageForm!: FormGroup;

  constructor(private supabase: SupabaseService, private router: Router, private fb: NonNullableFormBuilder) {
    // Load current session to show email
    this.supabase.getSession().then((session) => {
      console.log(session);
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
  }

  async loadFriends() {
    const list = await this.supabase.listFriends();
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
      if (this._messageIds.has(id)) return;
      this._messageIds.add(id);
      const myId = await this.supabase.getUserId();
      // Only append if this event is for the currently selected friend
      if (this.selectedFriendId() !== friendId) return;
      this.messages.update((arr) => [
        ...arr,
        { id, from: row.sender_id === myId ? 'me' : 'them', text: row.content, at: new Date(row.created_at) },
      ]);
    };
    this._unsubscribe = this.supabase.subscribeToMessages(friendId, handler);
  }

  // Helper for template to display selected friend's name without using arrow functions in template
  friendName(id: string | null): string {
    if (!id) return 'Friend';
    const f = this.friends().find(p => p.id === id);
    return f?.name || f?.email || 'Friend';
  }

  ngOnDestroy(): void {
    if (this._unsubscribe) this._unsubscribe();
  }
}
