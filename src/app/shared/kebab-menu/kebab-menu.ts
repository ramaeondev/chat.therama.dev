import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kebab-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kebab-menu.html',
  styleUrls: ['./kebab-menu.scss']
})
export class KebabMenuComponent {
  @Input() friendId!: string;
  @Input() friendName!: string;
  @Input() position: 'top' | 'bottom' = 'bottom';
  @Input() isArchived: boolean = false;
  @Input() isBlocked: boolean = false;
  @Input() loading: boolean = false;

  @Output() archive = new EventEmitter<void>();
  @Output() block = new EventEmitter<void>();
  @Output() removeForMe = new EventEmitter<void>();
  @Output() removeForBoth = new EventEmitter<void>();

  showMenu = signal<boolean>(false);

  toggleMenu() {
    this.showMenu.set(!this.showMenu());
  }

  onArchive() {
    this.archive.emit();
    this.showMenu.set(false);
  }

  onBlock() {
    this.block.emit();
    this.showMenu.set(false);
  }

  onRemoveForMe() {
    this.removeForMe.emit();
    this.showMenu.set(false);
  }

  onRemoveForBoth() {
    this.removeForBoth.emit();
    this.showMenu.set(false);
  }

  // Close menu when clicking outside
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const menuElement = document.querySelector('[data-kebab-menu]');
    if (!menuElement?.contains(target)) {
      this.showMenu.set(false);
    }
  }
}
