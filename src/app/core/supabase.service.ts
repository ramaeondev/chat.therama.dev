import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  async signUpWithOtp(email: string, name: string) {
    return this.supabase.auth.signInWithOtp({
      email,
      options: { data: { name } },
    });
  }

  // Sign in with OTP restricted to existing users only (no auto sign-up)
  async signInWithOtpExistingOnly(email: string) {
    const { data, error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });
    if (error) throw error;
    return data;
  }

  // Verify OTP
  async verifyOtp(email: string, token: string) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    return data;
  }

  // Get current session
  async getSession(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  // Sign out
  async signOut() {
    await this.supabase.auth.signOut();
  }

  // ---------- Profiles & Messages (App Data) ----------
  async getUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user ?? null;
  }

  async getUserId(): Promise<string | null> {
    const u = await this.getUser();
    return u?.id ?? null;
  }

  // Ensure a profile row exists for the current user
  async upsertProfileFromAuth() {
    const user = await this.getUser();
    if (!user) return;
    const email = user.email ?? null;
    const name = (user.user_metadata?.['name'] as string | undefined) ?? null;
    await this.supabase.from('profiles').upsert({ id: user.id, email, name }).eq('id', user.id);
  }

  // List all other profiles as friends (no filtering)
  async listFriends() {
    const myId = await this.getUserId();
    const query = this.supabase.from('profiles').select('id, email, name').order('name', { ascending: true });
    const { data, error } = await query;
    if (error) throw error;
    const all = data || [];
    return all.filter((p: any) => p.id !== myId);
  }

  // List messages between current user and friend
  async listMessages(friendId: string) {
    const myId = await this.getUserId();
    if (!myId) return [];
    const { data, error } = await this.supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async sendMessage(friendId: string, content: string) {
    const myId = await this.getUserId();
    if (!myId) throw new Error('Not authenticated');
    const { data, error } = await this.supabase
      .from('messages')
      .insert({ sender_id: myId, receiver_id: friendId, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  subscribeToMessages(friendId: string, onInsert: (row: any) => void) {
    const channel = this.supabase.channel(`messages-with-${friendId}`);
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${friendId}`,
      },
      (payload) => onInsert(payload.new)
    );
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${friendId}`,
      },
      (payload) => onInsert(payload.new)
    );
    channel.subscribe();
    return () => {
      this.supabase.removeChannel(channel);
    };
  }
}

