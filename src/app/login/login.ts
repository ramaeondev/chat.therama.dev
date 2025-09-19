import { Component } from '@angular/core';
import { SupabaseService } from '../core/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule] ,
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email = '';
  otp = '';
  message = '';
  loading = false;

  constructor(private supabase: SupabaseService) { }

  async verifyOtp() {
    this.loading = true;
    try {
      await this.supabase.verifyOtp(this.email, this.otp);
      this.message = 'Login successful!';
    } catch (err: any) {
      this.message = err.message;
    } finally {
      this.loading = false;
    }
  }
}
