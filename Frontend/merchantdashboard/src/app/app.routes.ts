import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login').then((m) => m.LoginComponent),
  },

  {
    path: 'signup',
    loadComponent: () =>
      import('./features/dashboard/signup/signup').then((m) => m.SignupComponent),
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/DashboardComponent/dashboard-componenr/dashboard-component').then((m) => m.DashboardComponent),
    children: [
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/dashboard/orders/orders').then(
            (m) => m.OrdersComponent
          ),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./features/dashboard/messages/messages').then(
            (m) => m.MessagesComponent
          ),
      },

      
      {
        path: 'ai-advisor',
        loadComponent: () =>
          import('./features/dashboard/ai-advisor/ai-advisor').then(
            (m) => m.AiAdvisor
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/dashboard/constumer/constumer').then(
            (m) => m.CustomersComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/dashboard/products/products').then(
            (m) => m.ProductsComponent
          ),
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/dashboard/expenses/expenses').then(
            (m) => m.ExpensesComponent
          ),
      },
      {
        path: 'delivery',
        loadComponent: () =>
          import('./features/dashboard/delivery/delivery').then(
            (m) => m.Delivery
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/dashboard/analytics/analytics').then(
            (m) => m.AnalyticsComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/dashboard/settings/settings').then(
            (m) => m.Settings
          ),
      },
    ],
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];