import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Product {
  _id?: string;
  merchantId?: string;
  name: string;
  description?: string;
  buyingPrice?: number;
  sellingPrice?: number;
  stock: number;
  imageUrl?: string;
  lowStockThreshold?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock'; // computed virtual from the backend
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private baseUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product);
  }

  updateProduct(id: string, changes: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, changes);
  }

  // Convenience helper for the common case of just adjusting stock
  // (e.g. after a manual restock, or when reducing stock on order confirmation)
  updateStock(id: string, stock: number): Observable<Product> {
    return this.updateProduct(id, { stock });
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}