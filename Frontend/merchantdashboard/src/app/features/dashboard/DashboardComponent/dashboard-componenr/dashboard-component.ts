import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { ProductService } from '../../../../core/services/product';
import { OrderService } from '../../../../core/services/order';
import { AnalyticsService, AnalyticsSummary } from '../../../../core/services/analytics';
import { Language, LanguageService } from '../../../../core/services/language';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss',
})
export class DashboardComponent implements OnInit {
  navItems = [
    { path: 'orders', key: 'orders', icon: 'ti-list-details' },
    { path: 'customers', key: 'customers', icon: 'ti-users' },
    { path: 'products', key: 'products', icon: 'ti-box' },
    { path: 'expenses', key: 'expenses', icon: 'ti-receipt' },
    { path: 'analytics', key: 'analytics', icon: 'ti-chart-bar' },
    { path: 'ai-advisor', key: 'advisor', icon: 'ti-robot' },
    { path: 'settings', key: 'settings', icon: 'ti-settings' },
  ];

  summary: AnalyticsSummary | null = null;
  pendingOrders = 0;
  totalProducts = 0;

  constructor(
    public authService: AuthService,
    private productService: ProductService,
    private orderService: OrderService,
    private analyticsService: AnalyticsService,
    private changeDetectorRef: ChangeDetectorRef,
    public language: LanguageService
  ) { }

  setLanguage(language: Language): void {
    this.language.setLanguage(language);
  }

  ngOnInit() {
    this.authService.refreshMerchant().subscribe();
    const currentMonth = new Date().toISOString().slice(0, 7);

    this.analyticsService.getSummary(currentMonth).subscribe({
      next: (summary) => {
        this.summary = summary;
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.summary = null;
        this.changeDetectorRef.detectChanges();
      },
    });

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.totalProducts = products.length;

        const lowThree = products.filter((p) => Number(p.stock) === 3);
        if (lowThree.length > 0) {
          const names = lowThree.map((p) => `${p.name} (${p.stock})`).join(', ');
          alert(`Low stock warning: these products have 3 items left: ${names}`);
        }
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.totalProducts = 0;
        this.changeDetectorRef.detectChanges();
      },
    });

    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.pendingOrders = orders.filter((order) => order.status === 'pending').length;

        if (orders && orders.length > 0) {
          const pendingList = orders
            .filter((order) => order.status === 'pending')
            .map((o) => {
              const productName = typeof o.productId === 'object' ? (o.productId as any).name : o.productId;
              return `${o.customerName} — ${productName || 'Unknown product'} (x${o.quantity || 1})`;
            })
            .join('\n');

          if (pendingList) {
            alert(`Pending orders:\n${pendingList}`);
          }
        }
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.pendingOrders = 0;
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value || 0);
  }

  logout() {
    this.authService.logout();
  }
}