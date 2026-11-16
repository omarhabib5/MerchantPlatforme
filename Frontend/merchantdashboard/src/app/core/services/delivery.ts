import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order } from './order';

// Orders grouped by delivery company name, e.g. { "Aramex": [...], "First Delivery": [...] }
export type TrackedOrdersByCompany = Record<string, Order[]>;

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private baseUrl = `${environment.apiUrl}/delivery`;

  constructor(private http: HttpClient) {}

  // Fetches shipped/delivered/rejected orders grouped by delivery company —
  // feeds the Delivery screen from the dashboard mockup.
  getTrackedOrders(): Observable<TrackedOrdersByCompany> {
    return this.http.get<TrackedOrdersByCompany>(`${this.baseUrl}/tracked`);
  }

  // Update delivery company / tracking ID / status for a single order
  updateDelivery(
    orderId: string,
    changes: { deliveryCompany?: string; trackingId?: string; status?: Order['status'] }
  ): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/${orderId}`, changes);
  }
}