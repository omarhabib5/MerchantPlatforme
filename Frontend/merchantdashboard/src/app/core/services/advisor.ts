import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Language } from './language';

export interface AdvisorResponse {
    answer: string;
    context: {
        totalOrders: number;
        deliveredOrders: number;
        rejectedOrders: number;
        rejectionRatePercent: number;
        revenue: number;
        totalExpenses: number;
        netProfit: number;
    };
}

export interface AdvisorConversationMessage {
    _id: string;
    role: 'merchant' | 'advisor';
    content: string;
    createdAt: string;
}

export type AiNoteTone = 'danger' | 'success' | 'warning' | 'info';

export interface AiInsightNote {
    badge: string;
    tone: AiNoteTone;
    title: string;
    summary: string;
    suggestion: string;
    actionText: string;
    detailTitle: string;
    insight: string;
    reasons: string[];
    actions: string[];
}

@Injectable({ providedIn: 'root' })
export class AdvisorService {
    private readonly baseUrl = `${environment.apiUrl}/advisor`;

    constructor(private http: HttpClient) { }

    ask(question: string, language: Language): Observable<AdvisorResponse> {
        return this.http.post<AdvisorResponse>(`${this.baseUrl}/chat`, { question, language });
    }

    getNotes(language: Language): Observable<{ notes: AiInsightNote[] }> {
        return this.http.post<{ notes: AiInsightNote[] }>(`${this.baseUrl}/notes`, { language });
    }

    getConversation(): Observable<{ messages: AdvisorConversationMessage[] }> {
        return this.http.get<{ messages: AdvisorConversationMessage[] }>(`${this.baseUrl}/conversation`);
    }
}