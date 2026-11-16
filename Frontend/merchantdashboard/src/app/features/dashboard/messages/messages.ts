import { ChangeDetectorRef, Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, Message } from '../../../core/services/MessageService';

type PlatformFilter = 'all' | 'facebook' | 'instagram';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './messages.html',
  styleUrl: './messages.scss',
})
export class MessagesComponent implements OnInit {
  messages = signal<Message[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  activeFilter = signal<PlatformFilter>('all');

  filteredMessages = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.messages();
    return this.messages().filter((m) => m.platform === filter);
  });

  constructor(private messageService: MessageService, private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages() {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.messageService.getMessages().subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.loading.set(false);
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set("Couldn't load messages. Try refreshing.");
        this.loading.set(false);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  setFilter(filter: PlatformFilter) {
    this.activeFilter.set(filter);
  }

  hasOrderData(message: Message): boolean {
    const data = message.extractedOrderData;
    if (!data) return false;
    return !!(data.product || data.quantity || data.address || data.phone);
  }
}