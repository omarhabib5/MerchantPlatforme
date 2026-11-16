import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AnalyticsSummary {
  revenue: number;
  totalExpenses: number;
  netProfit: number;
  totalOrders: number;
  rejectedOrders: number;
  rejectionRate: number;
}

export interface MonthlyTargets {
  month: string;
  revenueGoal: number;
  orderGoal: number;
  profitGoal: number;
}

export interface ProductAnalytics {
  _id: string; // productId
  orderCount: number;
  rejectedCount: number;
  revenue?: number;
  product: {
    _id: string;
    name: string;
    sellingPrice?: number;
    buyingPrice?: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private baseUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) { }

  // Revenue, expenses, net profit, order count, and rejection rate for the current month —
  // feeds the top metric cards on the Analytics screen.
  getMonths(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/months`);
  }

  getSummary(month: string): Observable<AnalyticsSummary> {
    return this.http.get<AnalyticsSummary>(`${this.baseUrl}/summary`, { params: new HttpParams().set('month', month) });
  }

  getTargets(month: string): Observable<MonthlyTargets> {
    return this.http.get<MonthlyTargets>(`${this.baseUrl}/targets`, {
      params: new HttpParams().set('month', month),
    });
  }

  saveTargets(targets: MonthlyTargets): Observable<MonthlyTargets> {
    return this.http.put<MonthlyTargets>(`${this.baseUrl}/targets`, targets);
  }

  // Order count and rejection count grouped by product —
  // feeds the "orders per product" table/chart.
  getOrdersPerProduct(month: string): Observable<ProductAnalytics[]> {
    return this.http.get<ProductAnalytics[]>(`${this.baseUrl}/orders-per-product`, { params: new HttpParams().set('month', month) });
  }
}