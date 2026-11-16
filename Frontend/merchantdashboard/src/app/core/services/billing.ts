import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BillingService {
    constructor(private http: HttpClient) { }

    startCheckout() {
        return this.http.post<{ payUrl: string; amount: number }>(`${environment.apiUrl}/billing/checkout`, {});
    }
}