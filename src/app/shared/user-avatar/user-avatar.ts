import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="src; else initialsTpl">
      <img [src]="src" [alt]="alt || 'avatar'"
           class="rounded-full object-cover"
           [ngStyle]="{ width: size + 'px', height: size + 'px' }" />
    </ng-container>
    <ng-template #initialsTpl>
      <div class="rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold"
           [ngStyle]="{ width: size + 'px', height: size + 'px', fontSize: fontSize + 'px' }"
           [attr.aria-label]="alt || 'avatar'">
        {{ initials(name) }}
      </div>
    </ng-template>
  `,
})
export class UserAvatarComponent {
  @Input() name: string | null | undefined;
  @Input() src: string | null | undefined;
  @Input() size = 28; // default 28px
  @Input() alt = '';

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
