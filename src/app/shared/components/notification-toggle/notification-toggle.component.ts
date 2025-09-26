import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <button 
        (click)="toggleMenu()" 
        class="p-2 rounded-full hover:bg-gray-100 relative"
        [class.text-gray-500]="!isEnabled"
        [class.text-blue-500]="isEnabled"
        [title]="isEnabled ? 'Disable notifications' : 'Enable notifications'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        @if (showDot) {
          <span class="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        }
      </button>
      
      <!-- Dropdown menu -->
      @if (showMenu) {
        <div class="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
          <div class="px-4 py-2 text-sm text-gray-700 border-b">
            <p class="font-medium">Notifications</p>
            <p class="text-xs text-gray-500">Manage your notification preferences</p>
          </div>
          <div class="px-4 py-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                class="rounded text-blue-600" 
                [checked]="isEnabled"
                (change)="toggleNotifications()"
              >
              <span class="text-sm text-gray-700">
                @if (isEnabled) {
                  Disable
                } @else {
                  Enable
                } notifications
              </span>
            </label>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class NotificationToggleComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private subscription: Subscription | null = null;
  
  isEnabled = false;
  showMenu = false;
  showDot = false; // Can be used to show unread notifications

  ngOnInit(): void {
    this.subscription = this.notificationService.notificationsEnabled$
      .subscribe(enabled => {
        this.isEnabled = enabled;
      });
  }

  toggleNotifications(): void {
    this.notificationService.toggleNotifications();
  }

  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
