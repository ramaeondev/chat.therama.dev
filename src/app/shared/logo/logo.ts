import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.html'
})
export class LogoComponent {
  @Input() subtitle: string = 'chat.therama.dev';
}
