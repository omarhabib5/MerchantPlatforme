import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AnalyticsService,
  AnalyticsSummary,
  MonthlyTargets,
  ProductAnalytics,
} from '../../../core/services/analytics';
import { Product, ProductService } from '../../../core/services/product';
import { AdvisorService } from '../../../core/services/advisor';
import { LanguageService } from '../../../core/services/language';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class AnalyticsComponent implements OnInit {
  summary = signal<AnalyticsSummary | null>(null);
  products = signal<Product[]>([]);
  productStats = signal<ProductAnalytics[]>([]);
  targets = signal<MonthlyTargets>({ month: '', revenueGoal: 0, orderGoal: 0, profitGoal: 0 });
  availableMonths = signal<string[]>([]);
  selectedMonth = signal(new Date().toISOString().slice(0, 7));
  loading = signal(true);
  savingTargets = signal(false);
  loadingAdvice = signal(false);
  aiAdvice = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor(
    private analyticsService: AnalyticsService,
    private productService: ProductService,
    private advisorService: AdvisorService,
    private changeDetectorRef: ChangeDetectorRef,
    public language: LanguageService,
  ) { }

  ngOnInit() {
    this.analyticsService.getMonths().subscribe({
      next: (months) => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        this.availableMonths.set([...new Set(months)].filter((month) => month !== currentMonth));
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set("Couldn't load analytics months.");
        this.changeDetectorRef.detectChanges();
      },
    });
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set("Couldn't load products for the profit plan.");
        this.changeDetectorRef.detectChanges();
      },
    });
    this.loadAnalytics(this.selectedMonth());
  }

  selectMonth(month: string): void {
    if (month === this.selectedMonth()) return;
    this.selectedMonth.set(month);
    this.loadAnalytics(month);
  }

  updateTarget(value: string): void {
    if (this.isHistoricalMonth()) return;
    this.targets.update((targets) => ({
      ...targets,
      revenueGoal: 0,
      orderGoal: 0,
      profitGoal: Math.max(0, Number(value) || 0),
    }));
  }

  saveTargets(): void {
    if (this.isHistoricalMonth()) return;
    this.savingTargets.set(true);
    this.errorMessage.set(null);
    const profitTarget = { ...this.targets(), revenueGoal: 0, orderGoal: 0 };
    this.targets.set(profitTarget);
    this.analyticsService.saveTargets(profitTarget).subscribe({
      next: (targets) => {
        this.targets.set(targets);
        this.savingTargets.set(false);
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set("Couldn't save monthly targets.");
        this.savingTargets.set(false);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  progress(value: number, goal: number): number {
    if (goal <= 0) return 0;
    return Math.min(100, Math.round((value / goal) * 100));
  }

  remaining(value: number, goal: number): number {
    return Math.max(0, goal - value);
  }

  askForGoalAdvice(): void {
    const summary = this.summary();
    const targets = this.targets();
    if (!summary || this.loadingAdvice()) return;

    const productData = this.products()
      .map((product) => ({
        name: product.name,
        buyingPrice: Number(product.buyingPrice || 0),
        sellingPrice: Number(product.sellingPrice || 0),
        margin: Number(product.sellingPrice || 0) - Number(product.buyingPrice || 0),
        stock: product.stock,
      }))
      .filter((product) => product.margin > 0);
    const question = `For ${this.selectedMonth()}, calculate a concrete product order mix to reach a gross profit target of ${targets.profitGoal} DT. Gross profit per order is selling price minus buying price. Use only these products and prices: ${JSON.stringify(productData)}. Give the exact number of orders for each product (for example, x of Product A and y of Product B), show the margin calculation, total orders, and any stock limitation. Current delivered gross profit is ${summary.revenue} DT and current orders are ${summary.totalOrders}. Do not use invented products or prices.`;
    this.loadingAdvice.set(true);
    this.aiAdvice.set(null);
    this.advisorService.ask(question, this.language.language()).subscribe({
      next: (response) => {
        this.aiAdvice.set(response.answer);
        this.loadingAdvice.set(false);
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.aiAdvice.set('The AI advisor could not provide an explanation right now.');
        this.loadingAdvice.set(false);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  currentMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  isHistoricalMonth(): boolean {
    return this.selectedMonth() !== this.currentMonth();
  }

  monthLabel(month: string): string {
    return new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }

  private loadAnalytics(month: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.aiAdvice.set(null);

    this.analyticsService.getTargets(month).subscribe({
      next: (targets) => {
        this.targets.set({ ...targets, revenueGoal: 0, orderGoal: 0 });
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set("Couldn't load monthly targets.");
        this.changeDetectorRef.detectChanges();
      },
    });


    this.analyticsService.getSummary(month).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set("Couldn't load analytics summary.");
        this.changeDetectorRef.detectChanges();
      },
    });

    this.analyticsService.getOrdersPerProduct(month).subscribe({
      next: (stats) => {
        this.productStats.set(stats);
        this.loading.set(false);
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set("Couldn't load product analytics.");
        this.loading.set(false);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  rejectionRateFor(stat: ProductAnalytics): number {
    if (!stat.orderCount) return 0;
    return Math.round((stat.rejectedCount / stat.orderCount) * 100);
  }
}