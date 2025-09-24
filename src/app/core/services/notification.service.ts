import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsEnabledSubject = new BehaviorSubject<boolean>(false);
  private notificationSound: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private defaultSoundUrl = '/assets/sounds/notification.mp3';
  private fallbackFrequencies = [440, 523.25, 659.25]; // A4, C5, E5 (A minor chord)

  constructor() {
    this.loadNotificationState();
    this.initializeAudio();
  }

  private loadNotificationState(): void {
    const savedState = localStorage.getItem('notificationsEnabled');
    const isEnabled = savedState ? JSON.parse(savedState) : false;
    this.notificationsEnabledSubject.next(isEnabled);
  }

  private saveNotificationState(enabled: boolean): void {
    localStorage.setItem('notificationsEnabled', JSON.stringify(enabled));
    this.notificationsEnabledSubject.next(enabled);
  }

  private async initializeAudio(): Promise<void> {
    try {
      // Try to initialize Web Audio API
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
      }

      // Try to load the notification sound
      const response = await fetch(this.defaultSoundUrl);
      if (response.ok) {
        this.notificationSound = new Audio(this.defaultSoundUrl);
        this.notificationSound.load();
      }
    } catch (error) {
      console.warn('Could not initialize audio:', error);
    }
  }

  private playFallbackSound(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const now = this.audioContext.currentTime;
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.1; // 10% volume
      gainNode.connect(this.audioContext.destination);

      this.fallbackFrequencies.forEach((freq, i) => {
        const oscillator = this.audioContext!.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now);
        oscillator.connect(gainNode);
        oscillator.start(now);
        oscillator.stop(now + 0.3); // 300ms duration
      });
    } catch (error) {
      console.warn('Could not play fallback sound:', error);
    }
  }

  get notificationsEnabled$(): Observable<boolean> {
    return this.notificationsEnabledSubject.asObservable();
  }

  get currentNotificationState(): boolean {
    return this.notificationsEnabledSubject.value;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  toggleNotifications(): void {
    const currentState = this.notificationsEnabledSubject.value;
    if (!currentState) {
      this.requestPermission().then(granted => {
        this.saveNotificationState(granted);
      });
    } else {
      this.saveNotificationState(false);
    }
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.notificationsEnabledSubject.value) return;
    
    try {
      if (Notification.permission !== 'granted') {
        const permission = await this.requestPermission();
        if (!permission) return;
      }

      const notification = new Notification(title, options);
      
      // Try to play the notification sound
      try {
        if (this.notificationSound) {
          await this.notificationSound.play();
        } else {
          // Fallback to Web Audio API if the audio element fails
          this.playFallbackSound();
        }
      } catch (soundError) {
        console.warn('Could not play notification sound, using fallback:', soundError);
        this.playFallbackSound();
      }

      // Focus the window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Clean up
  ngOnDestroy(): void {
    // Clean up audio resources
    if (this.notificationSound) {
      this.notificationSound.pause();
      this.notificationSound = null;
    }
    
    // Clean up audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(e => console.warn('Error closing audio context:', e));
      this.audioContext = null;
    }
  }
}
