import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block" [style.width.px]="size" [style.height.px]="size">
      <ng-container *ngIf="src; else initialsTpl">
        <img [src]="src" [alt]="alt || 'avatar'"
             class="rounded-full object-cover w-full h-full"
             [style.background]="backgroundColor" />
      </ng-container>
      <ng-template #initialsTpl>
        <div class="rounded-full w-full h-full flex items-center justify-center font-semibold text-white"
             [style.background]="backgroundColor"
             [style.fontSize.px]="fontSize"
             [attr.aria-label]="alt || 'avatar'">
          {{ initials(name) }}
        </div>
      </ng-template>
      
      <!-- Status indicator -->
      <div *ngIf="status !== undefined" 
           class="absolute bottom-0 right-0 rounded-full border-2 border-white"
           [class.bg-green-500]="status === 'online'"
           [class.bg-gray-400]="status === 'offline'"
           [class.bg-yellow-500]="status === 'away'"
           [class.bg-red-500]="status === 'busy'"
           [style.width.px]="statusSize"
           [style.height.px]="statusSize">
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAvatarComponent {
  // Simple cache to ensure consistent colors for the same user
  private static colorCache: Map<string, string> = new Map();
  @Input() name: string | null | undefined;
  @Input() src: string | null | undefined;
  @Input() size = 28; // default 28px
  @Input() alt = '';
  @Input() status?: 'online' | 'offline' | 'away' | 'busy';
  @Input() userId?: string; // Add userId input for better consistency
  
  // Color palette optimized for avatar backgrounds
  // Using distinct colors with good contrast against white text
  private static readonly colors = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
    '#f43f5e', // rose-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316', // orange-500
    '#a855f7', // purple-500
    '#ef4444', // red-500
  ];

  /**
   * Gets a consistent color for a given key (user ID or name)
   */
  private getColorForKey(key: string): string {
    // Check cache first
    if (UserAvatarComponent.colorCache.has(key)) {
      return UserAvatarComponent.colorCache.get(key)!;
    }

    // Generate a stable hash for the key
    const hash = this.stringToHash(key);
    const colorIndex = hash % UserAvatarComponent.colors.length;
    const color = UserAvatarComponent.colors[colorIndex];
    
    // Cache the result
    UserAvatarComponent.colorCache.set(key, color);
    return color;
  }

  /**
   * Generates a consistent numeric hash from a string
   */
  private stringToHash(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    
    // Simple hash function that's consistent across runs
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash);
  }

  // Compute background color based on user ID or name
  get backgroundColor(): string {
    // Try to use userId first, fall back to name if userId is not available
    const key = this.userId || this.name || '';
    
    // If no key is available, use default gray
    if (!key.trim()) return '#6b7280';
    
    try {
      // Get a consistent color for this key
      return this.getColorForKey(key);
    } catch (e) {
      console.error('Error computing avatar color:', e);
      return '#6b7280'; // Fallback to gray on error
    }
  }
  
  // Status indicator size is proportional to avatar size
  get statusSize(): number {
    return Math.max(8, Math.round(this.size * 0.25));
  }

  get fontSize() {
    // Roughly 40% of size for good balance
    return Math.max(10, Math.round(this.size * 0.4));
  }

  initials(name?: string | null): string {
    const n = (name || '').trim();
    if (!n) return '?';
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
}
