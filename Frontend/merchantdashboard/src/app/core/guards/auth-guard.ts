import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// Blocks access to /dashboard/* routes if there's no JWT stored.
// Redirects to /login instead, keeping unauthenticated users out.
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};