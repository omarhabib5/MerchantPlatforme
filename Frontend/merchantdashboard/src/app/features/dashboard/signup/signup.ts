import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class SignupComponent {
  name = '';
  email = '';
  password = '';

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(private authService: AuthService, private router: Router, private changeDetectorRef: ChangeDetectorRef) { }

  submit() {
    this.errorMessage.set(null);

    if (!this.name.trim() || !this.email.trim() || !this.password) {
      this.errorMessage.set('Please fill in all fields.');
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    this.loading.set(true);
    this.authService.register(this.name.trim(), this.email.trim(), this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.changeDetectorRef.detectChanges();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.error || 'Could not create your account. Please try again.');
        this.changeDetectorRef.detectChanges();
      },
    });
  }
}