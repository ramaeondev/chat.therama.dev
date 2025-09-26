import { Component, EventEmitter, Input, Output, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageCropperComponent } from 'ngx-image-cropper';
import { UserAvatarComponent } from '../user-avatar/user-avatar';
import { SupabaseService } from '../../core/supabase.service';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ImageCropperComponent, 
    UserAvatarComponent
  ],
  templateUrl: './profile-dialog.html',
  styleUrl: './profile-dialog.scss'
})
export class ProfileDialogComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private datePipe = inject(DatePipe);
  
  @Input() profileName: string = '';
  @Input() profileAvatarUrl: string | null = null;
  
  // User data that will be loaded directly
  email = signal<string>('');
  lastSignIn = signal<string>('');
  memberSince = signal<string>('');
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ name: string; avatarFile?: File }>();
  @Output() removeAvatar = new EventEmitter<void>();
  @Output() deleteAccount = new EventEmitter<void>();

  imageChangedEvent: any = null;
  croppedImageBase64: string | null = null;
  selectedImageFile: File | null = null;
  deleteConfirmText: string = '';
  cropping = signal<boolean>(false);
  saving = signal<boolean>(false);
  showConfirmDialog = signal<boolean>(false);
  showDeleteConfirmDialog = signal<boolean>(false);
  deleting = signal<boolean>(false);

  async ngOnInit() {
    await this.loadUserData();
  }

  private async loadUserData() {
    try {
      const { data: { user }, error } = await this.supabase.client.auth.getUser();
      
      if (error) throw error;
      if (!user) return;
      
      this.email.set(user.email || '');
      
      // Format dates
      if (user.last_sign_in_at) {
        const lastSignInDate = new Date(user.last_sign_in_at);
        this.lastSignIn.set(this.formatDate(lastSignInDate));
      }
      
      if (user.created_at) {
        const createdAt = new Date(user.created_at);
        this.memberSince.set(this.formatDate(createdAt));
      }
      
      // If profile name is not provided, use user's name or email
      const fullName = user.user_metadata ? (user.user_metadata as any)['full_name'] : null;
      if (!this.profileName && (fullName || user.email)) {
        this.profileName = fullName || user.email?.split('@')[0] || '';
      }
      
      // If avatar URL is not provided, try to get it from user_metadata
      const avatarUrl = user.user_metadata ? (user.user_metadata as any)['avatar_url'] : null;
      if (!this.profileAvatarUrl && avatarUrl) {
        this.profileAvatarUrl = avatarUrl;
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }
  
  private formatDate(date: Date): string {
    return this.datePipe.transform(date, 'medium') || '';
  }

  onClose() {
    this.close.emit();
  }

  onNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.profileName = input.value.trimStart();
  }

  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      console.log('File selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeMB: (file.size / 1024 / 1024).toFixed(2)
      });

      // Check file type
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type selected:', file.type);
        alert('Please select an image file');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large:', file.size);
        alert('Image size should be less than 5MB');
        return;
      }

      // Store the selected file
      this.selectedImageFile = file;

      // Create the imageChangedEvent in the format expected by ngx-image-cropper
      this.imageChangedEvent = {
        target: {
          files: [file]
        }
      };

      // Enable cropping UI
      this.cropping.set(true);

      // Reset the input value to allow selecting the same file again
      input.value = '';

      console.log('File selection completed successfully');
    }
  }

  onImageCropped(event: any) {
    console.log('=== IMAGE CROPPED EVENT DEBUG ===');
    console.log('Event received:', event);
    console.log('Event type:', typeof event);
    console.log('Event constructor:', event?.constructor?.name);
    console.log('Event keys:', Object.keys(event || {}));
    console.log('Event properties:');

    if (event && typeof event === 'object') {
      for (const [key, value] of Object.entries(event)) {
        console.log(`  ${key}:`, value, `(type: ${typeof value})`);
      }
    }

    try {
      // Handle different possible event structures from ngx-image-cropper
      let croppedImageBase64 = null;

      if (event && event.base64) {
        // Direct base64 property (expected format)
        croppedImageBase64 = event.base64;
        console.log('✓ Using event.base64 directly');
      } else if (event && event.blob) {
        // Convert blob to base64
        console.log('✓ Converting blob to base64');
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.croppedImageBase64 = e.target.result;
          console.log('✓ Successfully converted blob to base64');
        };
        reader.readAsDataURL(event.blob);
        return; // Exit early since we're handling async conversion
      } else if (event && typeof event === 'string') {
        // Event is already a base64 string
        croppedImageBase64 = event;
        console.log('✓ Event is already a base64 string');
      } else if (event && event.dataURL) {
        // Alternative property name
        croppedImageBase64 = event.dataURL;
        console.log('✓ Using event.dataURL');
      } else if (event && event.croppedImage) {
        // Another possible property name
        croppedImageBase64 = event.croppedImage;
        console.log('✓ Using event.croppedImage');
      } else {
        console.warn('❌ Unexpected crop event format:', event);
        console.warn('❌ Event object:', JSON.stringify(event, null, 2));
        alert('Failed to process cropped image. Please try again.');
        this.cancelCropping();
        return;
      }

      if (croppedImageBase64) {
        this.croppedImageBase64 = croppedImageBase64;
        console.log('✓ Successfully set cropped image base64, length:', croppedImageBase64.length);
        console.log('✓ First 100 chars:', croppedImageBase64.substring(0, 100));
        // Don't close the dialog after cropping
        // Keep dialog open to allow user to save or cancel
      } else {
        console.warn('❌ No valid cropped image data found');
        alert('Failed to process cropped image. Please try again.');
        this.cancelCropping();
      }

    } catch (error) {
      console.error('❌ Error in onImageCropped:', error);
      alert('Failed to process cropped image. Please try again.');
      this.cancelCropping();
    }
  }

  onImageLoaded() {
    console.log('Image loaded successfully in cropper');
  }

  onCropperReady() {
    console.log('Image cropper is ready');
    // If we have a selected file, make sure it's loaded properly
    if (this.selectedImageFile && this.cropping()) {
      console.log('Triggering image load in cropper');
    }
  }

  cancelCropping() {
    console.log('Cancelling cropping process');
    // Reset all temporary cropping state
    this.croppedImageBase64 = null;
    this.selectedImageFile = null;
    this.imageChangedEvent = null;
    // Hide the cropping UI
    this.cropping.set(false);
    console.log('Cropping cancelled, all temporary state reset');
  }

  onLoadImageFailed(error: any) {
    console.error('Failed to load image in cropper:', error);
    this.cancelCropping();
    alert('Failed to load image for cropping. Please try selecting a different image file.');
  }

  async saveCroppedImage() {
    if (!this.croppedImageBase64) {
      console.warn('No cropped image to save');
      this.cancelCropping();
      return;
    }

    try {
      this.saving.set(true);
      console.log('Saving cropped image...');

      // Create a file from the base64 string
      const file = this.base64ToFile(this.croppedImageBase64, 'avatar.png');

      if (!file) {
        throw new Error('Failed to create file from cropped image');
      }

      console.log('Created file from cropped image:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Emit the save event with the new file
      this.save.emit({
        name: this.profileName,
        avatarFile: file
      });

      // Update the preview
      this.profileAvatarUrl = this.croppedImageBase64;

      // Reset the cropping state
      this.cropping.set(false);
      this.selectedImageFile = null;

      console.log('Cropped image saved successfully');

    } catch (error) {
      console.error('Error saving cropped image:', error);
      alert('Failed to save image. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  onSaveProfile() {
    if (this.saving()) return;
    if (!this.profileName.trim()) {
      alert('Please enter your name');
      return;
    }

    this.saving.set(true);

    // Prepare the avatar file if we have a cropped image
    let avatarFile: File | undefined = undefined;
    if (this.croppedImageBase64) {
      avatarFile = this.base64ToFile(
        this.croppedImageBase64,
        'profile-picture.png'
      ) || undefined;
      
      if (!avatarFile) {
        console.error('Failed to convert cropped image to file');
        alert('Failed to process the image. Please try again.');
        this.saving.set(false);
        return;
      }
      
      // Reset cropping state but don't close dialog
      this.cropping.set(false);
      this.imageChangedEvent = null;
      this.croppedImageBase64 = null;
    }

    // Emit the save event with the name and optional avatar file
    this.save.emit({
      name: this.profileName.trim(),
      ...(avatarFile && { avatarFile })
    });
    
    // Don't close the dialog after saving
    setTimeout(() => {
      this.saving.set(false);
    }, 1000);
  }

  onRemoveAvatarClick() {
    this.showConfirmDialog.set(true);
  }

  confirmRemoveAvatar() {
    this.showConfirmDialog.set(false);
    this.removeAvatar.emit();
  }

  cancelRemoveAvatar() {
    this.showConfirmDialog.set(false);
  }

  private base64ToFile(base64: string, filename: string): File | null {
    try {
      // Handle both data URLs and raw base64 strings
      const base64Data = base64.includes('base64,') 
        ? base64.split(',')[1] 
        : base64;
      
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Get the mime type from the base64 string or default to png
      const mimeMatch = base64.match(/^data:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      
      return new File([bytes], filename, { type: mimeType });
    } catch (error) {
      console.error('Error converting base64 to file:', error);
      return null;
    }
  }

  onDeleteAccount() {
    // Show the confirmation dialog
    this.showDeleteConfirmDialog.set(true);
  }
  
  confirmDeleteAccount() {
    if (this.deleting()) return;
    
    this.deleting.set(true);
    // Emit the deleteAccount event for the parent component to handle
    this.deleteAccount.emit();
    
    // In a real implementation, we would wait for the deletion to complete
    // For now, we'll just close the dialog
    this.showDeleteConfirmDialog.set(false);
    setTimeout(() => {
      this.saving.set(false);
      // Don't close the dialog
    }, 1000);
  }
}
