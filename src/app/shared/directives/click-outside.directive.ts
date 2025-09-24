import { Directive, ElementRef, EventEmitter, Output, OnDestroy, inject } from '@angular/core';

declare const ng: any; // For Angular dev mode check

@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective implements OnDestroy {
  @Output() clickOutside = new EventEmitter<Event>();
  private elementRef = inject(ElementRef);
  private documentClickHandler: (event: Event) => void = () => {};

  constructor() {
    // Use requestAnimationFrame to ensure the element is in the DOM
    requestAnimationFrame(() => {
      this.documentClickHandler = this.handleDocumentClick.bind(this);
      document.addEventListener('click', this.documentClickHandler, true);
    });
  }

  private handleDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const element = this.elementRef.nativeElement;
    
    // Check if the click was outside the element
    if (element && !element.contains(target)) {
      // Run in Angular zone
      Promise.resolve().then(() => {
        this.clickOutside.emit(event);
      });
    }
  }

  ngOnDestroy() {
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler, true);
    }
  }
}
