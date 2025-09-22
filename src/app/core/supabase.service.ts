import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, User, RealtimeChannel } from '@supabase/supabase-js';
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

  // Presence helpers
  presenceJoin(
    room: string,
    key: string,
    metadata: Record<string, any>,
    onSync: (channel: RealtimeChannel) => void
  ) {
    const channel = this.supabase.channel(`presence:${room}`, {
      config: { presence: { key } },
    });
    channel.on('presence', { event: 'sync' }, () => onSync(channel));
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track(metadata);
      }
    });
    return () => {
      this.supabase.removeChannel(channel);
    };
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
    const query = this.supabase.from('profiles').select('id, email, name, avatar_url').order('name', { ascending: true });
    const { data, error } = await query;
    if (error) throw error;
    const all = data || [];
    return all.filter((p: any) => p.id !== myId);
  }

  // Contacts: add an explicit contact entry for the current user
  async addContact(contactId: string) {
    const myId = await this.getUserId();
    if (!myId) throw new Error('Not authenticated');
    if (myId === contactId) return; // no-op
    const { error } = await this.supabase
      .from('contacts')
      .upsert({ user_id: myId, contact_id: contactId })
      .eq('user_id', myId)
      .eq('contact_id', contactId);
    if (error) throw error;
  }

  // Get contact ids for current user
  private async getContactIds(): Promise<string[]> {
    const myId = await this.getUserId();
    if (!myId) return [];
    const { data, error } = await this.supabase
      .from('contacts')
      .select('contact_id')
      .eq('user_id', myId);
    if (error) throw error;
    return (data || []).map((r: any) => r.contact_id as string);
  }

  // Get distinct counterpart ids from messages involving current user
  private async getMessageCounterpartIds(): Promise<string[]> {
    const myId = await this.getUserId();
    if (!myId) return [];
    // Fetch minimal columns then compute counterparts client-side
    const { data, error } = await this.supabase
      .from('messages')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .limit(1000); // basic cap; can be improved with pagination later
    if (error) throw error;
    const set = new Set<string>();
    for (const r of data || []) {
      const other: string = (r.sender_id === myId ? r.receiver_id : r.sender_id) as string;
      if (other && other !== myId) set.add(other);
    }
    return Array.from(set);
  }

  // Fetch profiles for a given set of ids
  private async getProfilesByIds(ids: string[]) {
    if (!ids.length) return [] as any[];
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, email, name, avatar_url')
      .in('id', ids);
    if (error) throw error;
    return data || [];
  }

  // Smart friends list: union of contacts + message counterparts
  async listFriendsSmart() {
    const [contacts, counterparts] = await Promise.all([
      this.getContactIds(),
      this.getMessageCounterpartIds(),
    ]);
    const set = new Set<string>([...contacts, ...counterparts]);
    const ids = Array.from(set);
    return await this.getProfilesByIds(ids);
  }

  private async getLastMessagesForIds(otherIds: string[]) {
    const myId = await this.getUserId();
    if (!myId || otherIds.length === 0) return {} as Record<string, any>;
    const { data, error } = await this.supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at')
      .or(`and(sender_id.eq.${myId},receiver_id.in.(${otherIds.join(',')})),and(receiver_id.eq.${myId},sender_id.in.(${otherIds.join(',')}))`)
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) throw error;
    const latestByOther: Record<string, any> = {};
    for (const m of data || []) {
      const other = m.sender_id === myId ? m.receiver_id : m.sender_id;
      if (!latestByOther[other]) {
        latestByOther[other] = m;
      }
    }
    return latestByOther;
  }

  async listFriendsSmartWithMeta() {
    const [contacts, counterparts] = await Promise.all([
      this.getContactIds(),
      this.getMessageCounterpartIds(),
    ]);
    const set = new Set<string>([...contacts, ...counterparts]);
    const ids = Array.from(set);
    const [profiles, latestMap, myId] = await Promise.all([
      this.getProfilesByIds(ids),
      this.getLastMessagesForIds(ids),
      this.getUserId(),
    ]);
    const enriched = (profiles as any[]).map((p) => {
      const m = latestMap[p.id];
      const last_message_at = m ? m.created_at : null;
      let last_message_text: string | null = null;
      if (m) {
        const raw = m.content as string;
        try {
          const obj = JSON.parse(raw);
          if (obj && obj.type === 'attachment') {
            last_message_text = obj.text ? `📎 ${obj.text}` : `📎 ${obj.name || 'Attachment'}`;
          } else {
            last_message_text = raw;
          }
        } catch {
          last_message_text = raw;
        }
      }
      const last_message_from_me = m ? m.sender_id === myId : null;
      return { ...p, last_message_at, last_message_text, last_message_from_me };
    });
    enriched.sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return tb - ta;
    });
    return enriched;
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

  // Upload an attachment to a private Supabase Storage bucket and return its storage path.
  // Ensure a bucket named "attachments" exists in your Supabase project.
  // Access is private; clients should request signed URLs using getSignedUrl.
  async uploadAttachment(file: File): Promise<{ path: string }> {
    const myId = await this.getUserId();
    if (!myId) throw new Error('Not authenticated');
    const bucket = 'chat.therama.dev';
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `${myId}/${Date.now()}_${rand}.${ext}`;
    const { error: uploadError } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    return { path };
  }

  // Send a message whose content is a JSON-encoded attachment payload.
  // This avoids database schema changes by keeping everything in the text
  // column and decoding client-side.
  async sendAttachmentMessage(
    friendId: string,
    meta: { path: string; name: string; mime: string; text?: string }
  ) {
    const payload = {
      type: 'attachment',
      path: meta.path,
      name: meta.name,
      mime: meta.mime,
      text: meta.text || '',
    };
    return await this.sendMessage(friendId, JSON.stringify(payload));
  }

  // Generate a signed URL for a given storage path in the attachments bucket.
  async getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
    const bucket = 'chat.therama.dev';
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  }

  subscribeToMessages(friendId: string, onInsert: (row: any) => void) {
    const channel = this.supabase.channel(`messages-with-${friendId}`);
    // We subscribe to events where current user is either sender or receiver,
    // and let the consumer validate the other party equals friendId.
    // This avoids missing events due to limited filter syntax.
    this.getUserId().then((myId) => {
      if (!myId) return;
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${myId}` },
        (payload) => onInsert(payload.new)
      );
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${myId}` },
        (payload) => onInsert(payload.new)
      );
      channel.subscribe();
    });
    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  // Find profile by email
  async findProfileByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, email, name, avatar_url')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return data; // null if not found
  }
}

