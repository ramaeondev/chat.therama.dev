import { Component, Input, Output, EventEmitter, inject, signal, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserAvatarComponent } from '../../user-avatar/user-avatar';
import { LogoComponent } from '../../logo/logo';
import { NotificationToggleComponent } from '../notification-toggle/notification-toggle.component';
import { ProfileDialogComponent } from '../../profile-dialog/profile-dialog';
import { SupabaseService } from '../../../core/supabase.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    UserAvatarComponent,
    LogoComponent,
    NotificationToggleComponent,
    ProfileDialogComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() realtimeConnected = false;
  @Input() isAdmin = false;
  @Input() profileAvatarUrl: string | null = null;
  @Input() profileName: string | null = null;
  @Input() userId = '';
  @Input() showSidebar = false;
  
  @Output() toggleSidebarEvent = new EventEmitter<void>();
  @Output() toggleMenuEvent = new EventEmitter<MouseEvent>();
  @Output() saveProfileEvent = new EventEmitter<{ name: string; avatarFile?: File }>();
  @Output() removeAvatarEvent = new EventEmitter<void>();
  @Output() deleteAccountEvent = new EventEmitter<void>();
  menuVisible = false;
  loggingOut = false;
  showProfileDialog = signal(false);
  showWhatsNewDialog = signal(false);
  changelog = signal('');
  
  private http = inject(HttpClient);
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  
  @ViewChild('profileMenuButton') profileMenuButton?: ElementRef<HTMLButtonElement>;
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.menuVisible && 
        this.profileMenuButton?.nativeElement && 
        !this.profileMenuButton.nativeElement.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.profile-menu')) {
      this.menuVisible = false;
    }
  }

  onToggleSidebar() {
    this.toggleSidebarEvent.emit();
  }

  toggleMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.menuVisible = !this.menuVisible;
    this.toggleMenuEvent.emit(event);
  }

  openProfile() {
    this.menuVisible = false;
    this.showProfileDialog.set(true);
  }
  
  closeDialogs() {
    this.showProfileDialog.set(false);
    this.showWhatsNewDialog.set(false);
  }

  async openWhatsNew() {
    this.menuVisible = false;
    this.showWhatsNewDialog.set(true);
    await this.loadChangelog();
  }
  
  private async loadChangelog() {
    try {
      const text = await this.http.get('assets/CHANGELOG.md', { responseType: 'text' }).toPromise();
      this.changelog.set(text || '');
    } catch {
      this.changelog.set('No release notes available.');
    }
  }

  async logout() {
    this.loggingOut = true;
    try {
      await this.supabase.signOut();
      this.router.navigate(['/signin']);
    } finally {
      this.loggingOut = false;
      this.menuVisible = false;
    }
  }

  onSaveProfile(profileData: { name: string; avatarFile?: File }) {
    this.saveProfileEvent.emit(profileData);
    this.closeDialogs();
  }

  onRemoveAvatar() {
    this.removeAvatarEvent.emit();
    this.closeDialogs();
  }

  onDeleteAccount() {
    this.deleteAccountEvent.emit();
    this.closeDialogs();
  }

  toggleAdminDashboard() {  
    const currentPath = this.router.url;
    if (currentPath === '/admin') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/admin']);
    }
  }
}
