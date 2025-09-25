import { Component, EventEmitter, Output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import 'emoji-picker-element';

// Standalone wrapper for the emoji-picker-element Web Component
// Usage: <app-emoji-picker (emojiSelect)="..." (closed)="..."></app-emoji-picker>
// Emits the selected emoji character via (emojiSelect)

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  template: `
    <div class="bg-white border rounded shadow p-2 w-full max-h-[300px] sm:max-h-[400px] overflow-auto">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm font-medium text-gray-700">Emoji</div>
        <button type="button" (click)="onClose()" class="text-xs px-2 py-1 border rounded hover:bg-gray-50">Close</button>
      </div>
      <emoji-picker (emoji-click)="onEmojiClick($event)"></emoji-picker>
    </div>
  `,
  styles: [
    `:host{display:block; max-width: 100%;}
     emoji-picker{ width: 100%; height: auto; max-height: 250px; }
    `
  ],
  // Allow custom element <emoji-picker>
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class EmojiPickerComponent {
  @Output() emojiSelect = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  onEmojiClick(e: any) {
    // Event shape from emoji-picker-element: e.detail.unicode
    const emoji = e?.detail?.unicode || e?.detail?.emoji || '';
    if (emoji) this.emojiSelect.emit(emoji);
  }

  onClose() {
    this.closed.emit();
  }
}
