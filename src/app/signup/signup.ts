import { CommonModule } from '@angular/common';
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../core/supabase.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss']
})
export class Signup {
  message: WritableSignal<string> = signal<string>('');
  error: WritableSignal<string> = signal<string>('');
  loading: WritableSignal<boolean> = signal<boolean>(false);
  private fb = inject(NonNullableFormBuilder);
  private supabase = inject(SupabaseService);

  form = this.fb.group({
    name: this.fb.control('', Validators.required),
    email: this.fb.control('', [Validators.required, Validators.email]),
  });

  async signUp() {
    this.message.set('');
    this.error.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { name, email } = this.form.getRawValue();

    try {
      const { error } = await this.supabase.signUpWithOtp(email, name);
      if (error) throw error;
      this.message.set('✅ Check your email for the OTP link!');
    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }
}
