import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Order {
  _id?: string;
  merchantId?: string;
  productId?: string | { _id: string; name: string; price: number };
  customerName: string;
  customerPhone: string;
  address: string;
  quantity?: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'rejected';
  source?: 'facebook' | 'instagram' | 'manual';
  deliveryCompany?: string;
  trackingId?: string;
  rejectionRiskScore?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderImportResult {
  imported: number;
  skipped: Array<{ row: number; reason: string }>;
  orders: Order[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private baseUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  // Fetch all orders, optionally filtered by status (matches the backend's ?status= query)
  getOrders(status?: string): Observable<Order[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Order[]>(this.baseUrl, { params });
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  createOrder(order: Partial<Order>): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, order);
  }

  importOrders(file: File): Observable<OrderImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<OrderImportResult>(`${this.baseUrl}/import`, formData);
  }

  updateOrder(id: string, changes: Partial<Order>): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/${id}`, changes);
  }

  // Convenience helper for the most common update — just changing status
  // (e.g. dashboard buttons like "Mark as shipped")
  updateStatus(id: string, status: Order['status']): Observable<Order> {
    return this.updateOrder(id, { status });
  }

  deleteOrder(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}