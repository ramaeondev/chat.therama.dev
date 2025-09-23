import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageCropperComponent } from 'ngx-image-cropper';
import { UserAvatarComponent } from '../user-avatar/user-avatar';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent, UserAvatarComponent],
  templateUrl: './profile-dialog.html',
  styleUrl: './profile-dialog.scss'
})
export class ProfileDialogComponent {
  @Input() profileName: string = '';
  @Input() profileAvatarUrl: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ name: string; avatarFile?: File }>();
  @Output() removeAvatar = new EventEmitter<void>();

  imageChangedEvent: any = null;
  croppedImageBase64: string | null = null;
  selectedImageFile: File | null = null;
  cropping = signal<boolean>(false);
  saving = signal<boolean>(false);
  showConfirmDialog = signal<boolean>(false);

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

  async saveProfile() {
    if (!this.profileName.trim()) return;
    
    if (this.croppedImageBase64) {
      await this.saveCroppedImage();
    } else {
      this.save.emit({ name: this.profileName });
    }
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
}
