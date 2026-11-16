import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(private authService: AuthService, private changeDetectorRef: ChangeDetectorRef, public language: LanguageService) { }

  submit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage.set('New password must be at least 6 characters.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set('New password and confirmation do not match.');
      return;
    }

    this.loading.set(true);
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message);
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.changeDetectorRef.detectChanges();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.error || 'Could not update your password.');
        this.changeDetectorRef.detectChanges();
      },
    });
  }
}
