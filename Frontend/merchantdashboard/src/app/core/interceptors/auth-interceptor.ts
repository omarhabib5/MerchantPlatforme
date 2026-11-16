import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Automatically attaches the JWT to every outgoing request to OUR backend,
// and redirects to /login if the backend ever responds with 401 (expired/invalid token).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  // Don't attach our JWT to external calls (e.g. Facebook's Graph API) —
  // only to requests going to our own backend.
  const isApiRequest = req.url.startsWith('/api') || req.url.includes('localhost:5000');

  const authReq =
    token && isApiRequest
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isApiRequest) {
        // Token missing/expired/invalid — clear it and send the merchant back to login
        localStorage.removeItem('token');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};