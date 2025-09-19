import { CommonModule } from '@angular/common';
import { Component, inject, signal, WritableSignal, OnDestroy } from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../core/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss']
})
export class Signup implements OnDestroy {
  message: WritableSignal<string> = signal<string>('');
  error: WritableSignal<string> = signal<string>('');
  loading: WritableSignal<boolean> = signal<boolean>(false);
  showOtp: WritableSignal<boolean> = signal<boolean>(false);
  remainingSeconds: WritableSignal<number> = signal<number>(0);
  private _intervalId: any = null;
  private fb = inject(NonNullableFormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  form = this.fb.group({
    name: this.fb.control('', Validators.required),
    email: this.fb.control('', [Validators.required, Validators.email]),
    otp: this.fb.control(''),
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
      this.message.set('✅ OTP sent! Please check your email and enter the code below.');
      this.showOtp.set(true);
      this.startResendTimer(120);
    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async verifyOtp() {
    this.message.set('');
    this.error.set('');

    const { email, otp } = this.form.getRawValue();
    if (!otp) {
      this.error.set('Please enter the OTP sent to your email.');
      return;
    }

    this.loading.set(true);
    try {
      await this.supabase.verifyOtp(email, otp);
      this.message.set('🎉 Signup complete! You are now logged in.');
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to verify OTP');
    } finally {
      this.loading.set(false);
    }
  }

  async resendOtp() {
    if (this.remainingSeconds() > 0) return;
    this.message.set('');
    this.error.set('');
    const { name, email } = this.form.getRawValue();
    this.loading.set(true);
    try {
      const { error } = await this.supabase.signUpWithOtp(email, name ?? '');
      if (error) throw error;
      this.message.set('OTP resent. Please check your inbox.');
      this.showOtp.set(true);
      this.startResendTimer(120);
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to resend OTP');
    } finally {
      this.loading.set(false);
    }
  }

  startResendTimer(seconds: number) {
    this.clearTimer();
    this.remainingSeconds.set(seconds);
    this._intervalId = setInterval(() => {
      const next = this.remainingSeconds() - 1;
      if (next <= 0) {
        this.remainingSeconds.set(0);
        this.clearTimer();
      } else {
        this.remainingSeconds.set(next);
      }
    }, 1000);
  }

  clearTimer() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  formatMMSS(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  goToSignin() {
    this.router.navigate(['/signin']);
  }
}
