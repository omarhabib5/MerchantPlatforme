import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Merchant {
  id: string;
  name: string;
  email: string | null;
  facebookPageId: string | null;
  instagramAccountId: string | null;
  trialEndsAt?: string | null;
  subscriptionStatus?: string;
  currentPeriodEndsAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Holds the logged-in merchant's info app-wide, readable by any component/service.
  currentMerchant = signal<Merchant | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  // On app startup, if a merchant was saved from a previous session, load it back in.
  private restoreSession() {
    const saved = localStorage.getItem('merchant');
    if (saved) {
      this.currentMerchant.set(JSON.parse(saved));
    }
  }

  // Called after a successful /api/auth/facebook response
  // (see FacebookAuthService — it calls this once login succeeds).
  setSession(token: string, merchant: Merchant) {
    localStorage.setItem('token', token);
    localStorage.setItem('merchant', JSON.stringify(merchant));
    this.currentMerchant.set(merchant);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('merchant');
    this.currentMerchant.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Fetches the latest merchant data from the backend
  // (useful after connecting a Facebook Page, to refresh facebookPageId/instagramAccountId).
  refreshMerchant() {
    return this.http.get<{ merchant: Merchant }>(`${environment.apiUrl}/auth/me`).pipe(
      tap((res) => {
        localStorage.setItem('merchant', JSON.stringify(res.merchant));
        this.currentMerchant.set(res.merchant);
      })
    );
  }

  // Email/password signup — saves the session automatically on success.
  register(name: string, email: string, password: string) {
    return this.http
      .post<{ token: string; merchant: Merchant }>(`${environment.apiUrl}/auth/register`, {
        name,
        email,
        password,
      })
      .pipe(tap((res) => this.setSession(res.token, res.merchant)));
  }

  // Email/password login — saves the session automatically on success.
  login(email: string, password: string) {
    return this.http
      .post<{ token: string; merchant: Merchant }>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(tap((res) => this.setSession(res.token, res.merchant)));
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }
}