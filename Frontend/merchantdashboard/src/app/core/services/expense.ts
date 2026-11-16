import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Expense {
  _id?: string;
  merchantId?: string;
  title: string;
  category?: 'publication' | 'ads' | 'logistics' | 'tools' | 'other' | string;
  amount: number;
  notes?: string;
  expenseDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private baseUrl = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.baseUrl);
  }

  getExpenseById(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.baseUrl}/${id}`);
  }

  createExpense(expense: Partial<Expense>): Observable<Expense> {
    return this.http.post<Expense>(this.baseUrl, expense);
  }

  updateExpense(id: string, changes: Partial<Expense>): Observable<Expense> {
    return this.http.put<Expense>(`${this.baseUrl}/${id}`, changes);
  }

  deleteExpense(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}