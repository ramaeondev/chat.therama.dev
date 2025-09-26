import { Component, inject, signal, computed, WritableSignal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/supabase.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AuthSession, UserMetadata } from '@supabase/supabase-js';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboardComponent implements OnDestroy {
  loading = signal(false);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  // User data
  session = signal<AuthSession | null>(null);
  profile = signal<any>(null);
  realtimeConnected = signal<boolean>(false);

  // Computed properties
  profileName = computed(() => this.profile()?.name || this.profile()?.email || null);
  profileAvatarUrl = computed(() => this.profile()?.avatar_url || null);
  isAdmin = computed(() => this.profile()?.is_admin || false);
  userId = computed(() => this.session()?.user?.id || '');
  showSidebar = signal<boolean>(false);
  user: WritableSignal<UserMetadata | null> = signal<UserMetadata | null>(null);
  private _unsubPresence: (() => void) | null = null;
  userEmail = signal<string>('');

  constructor() {
    // Get initial session
    this.supabase.client.auth.getSession().then(({ data: { session } }) => {
      this.session.set(session);
      if (session?.user) {
        this.loadProfile(session.user.id);
        const email = session?.user?.email ?? '';
        this.userEmail.set(email);
        this.user.set(session?.user?.user_metadata ?? null);
      }
    });

    // Listen for auth changes
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      if (session?.user) {
        this.loadProfile(session.user.id);
      } else {
        this.profile.set(null);
      }
    });
  }

  async loadProfile(userId: string) {
    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      this.profile.set(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  // Navigation methods
  navigateToAdmin() {
    // Already on admin page
  }

  // Menu methods
  toggleSidebar() {
    this.showSidebar.update(value => !value);
  }

  onProfileClickOutside(event: Event) {
    // Cast the event to MouseEvent if necessary
    const mouseEvent = event as MouseEvent;
    // Handle click outside if needed
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    // Handle menu toggle if needed
  }

  // Auth methods
  async logout() {
    this.loading.set(true);
    try {
      await this.supabase.client.auth.signOut();
      this.router.navigate(['/auth/signin']);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // Clean up on destroy
  ngOnDestroy() {
    if (this._unsubPresence) {
      this._unsubPresence();
    }
  }

  // Implement what's new functionality
  openWhatsNew() {
    // TODO: Implement what's new functionality
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
        this.realtimeConnected.set(true);
      }
    );
  }

}
