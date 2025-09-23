import { Component, inject, OnDestroy } from '@angular/core';
import { SupabaseService } from '../core/supabase.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { FooterComponent } from '../shared/footer/footer';
import { LogoComponent } from '../shared/logo/logo';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FooterComponent, LogoComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login implements OnDestroy {
  // Reactive form
  form: FormGroup;

  // Signals for UI state
  showOtp = signal(false);
  loading = signal(false);
  message = signal('');
  error = signal('');
  needSignup = signal(false);
  router = inject(Router);
  remainingSeconds = signal(0);
  private _intervalId: any = null;

  constructor(private supabase: SupabaseService, private fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', []],
    });
  }

  // Request OTP for the provided email and reveal OTP field
  async requestOtp() {
    if (this.form.get('email')?.invalid) {
      this.form.get('email')?.markAsTouched();
      return;
    }
    this.loading.set(true);
    this.message.set('');
    this.error.set('');
    this.needSignup.set(false);
    try {
      const email = this.form.get('email')!.value as string;
      // Restrict to existing users only
      await this.supabase.signInWithOtpExistingOnly(email);
      this.showOtp.set(true);
      this.message.set('OTP sent to your email. Please check your inbox.');
      this.needSignup.set(false);
      this.startResendTimer(120);
    } catch (err: any) {
      const msg = err?.message || '';
      const code = err?.code || '';
      if (code === 'otp_disabled' || msg.toLowerCase().includes('signups not allowed for otp')) {
        this.error.set('There was a problem logging in. Check your email or create an account.');
        this.needSignup.set(true);
        this.showOtp.set(false);
        this.clearTimer();
        this.remainingSeconds.set(0);
        this.form.get('otp')?.reset('');
      } else if (msg.toLowerCase().includes('user not found')) {
        this.error.set('No account found for this email. Please sign up first.');
        this.needSignup.set(true);
        this.showOtp.set(false);
        this.clearTimer();
        this.remainingSeconds.set(0);
        this.form.get('otp')?.reset('');
      } else {
        this.error.set(msg || 'Failed to send OTP');
        this.form.get('otp')?.reset('');
      }
    } finally {
      this.loading.set(false);
    }
  }

  async verifyOtp() {
    if (this.form.get('otp')?.invalid || !this.form.get('otp')?.value) {
      this.form.get('otp')?.markAsTouched();
      return;
    }
    this.loading.set(true);
    this.message.set('');
    this.error.set('');
    try {
      const email = this.form.get('email')!.value as string;
      const otp = this.form.get('otp')!.value as string;
      await this.supabase.verifyOtp(email, otp);
      this.message.set('Login successful!');
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to verify OTP');
    } finally {
      this.loading.set(false);
    }
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }

  // Resend OTP support
  async resendOtp() {
    if (this.form.get('email')?.invalid) {
      this.form.get('email')?.markAsTouched();
      return;
    }
    if (this.remainingSeconds() > 0) return; // guard
    this.loading.set(true);
    this.message.set('');
    try {
      const email = this.form.get('email')!.value as string;
      await this.supabase.signInWithOtpExistingOnly(email);
      this.message.set('OTP resent. Please check your inbox.');
      this.showOtp.set(true);
      this.startResendTimer(120);
    } catch (err: any) {
      const msg = err?.message || '';
      const code = err?.code || '';
      if (code === 'otp_disabled' || msg.toLowerCase().includes('signups not allowed for otp')) {
        this.error.set('Signups via OTP are disabled for this email. Please sign up first.');
        this.needSignup.set(true);
        this.showOtp.set(false);
        this.clearTimer();
        this.remainingSeconds.set(0);
        this.form.get('otp')?.reset('');
      } else if (msg.toLowerCase().includes('user not found')) {
        this.error.set('No account found for this email. Please sign up first.');
        this.needSignup.set(true);
        this.showOtp.set(false);
        this.clearTimer();
        this.remainingSeconds.set(0);
        this.form.get('otp')?.reset('');
      } else {
        this.error.set(msg || 'Failed to resend OTP');
      }
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
}
