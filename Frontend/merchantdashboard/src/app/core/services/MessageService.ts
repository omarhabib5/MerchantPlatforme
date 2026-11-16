import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OrderData {
  product?: string;
  quantity?: number;
  address?: string;
  phone?: string;
}

export interface Message {
  _id: string;
  merchantId: string;
  customerPsid: string;
  platform: 'facebook' | 'instagram';
  customerText: string;
  aiReply?: string;
  extractedOrderData?: OrderData;
  orderComplete: boolean;
  resultingOrderId?: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private baseUrl = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient) {}

  getMessages(platform?: 'facebook' | 'instagram'): Observable<Message[]> {
    let params = new HttpParams();
    if (platform) params = params.set('platform', platform);
    return this.http.get<Message[]>(this.baseUrl, { params });
  }
}