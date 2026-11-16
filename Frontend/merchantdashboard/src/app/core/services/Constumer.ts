import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Customer {
  _id: string;
  merchantId: string;
  name: string;
  phone: string;
  address?: string;
  totalOrders: number;
  deliveredOrders: number;
  rejectedOrders: number;
  source: 'facebook' | 'instagram' | 'manual';
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private baseUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) { }

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.baseUrl);
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/${id}`);
  }

  lookupByPhone(phone: string): Observable<Customer | null> {
    return this.http.get<Customer | null>(`${this.baseUrl}/lookup?phone=${encodeURIComponent(phone)}`);
  }

  deleteCustomer(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}