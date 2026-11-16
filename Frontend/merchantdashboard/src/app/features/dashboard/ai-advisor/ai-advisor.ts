import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdvisorService } from '../../../core/services/advisor';
import { LanguageService } from '../../../core/services/language';

interface ChatMessage {
  content: string;
  sender: 'merchant' | 'advisor';
  time: string;
}

@Component({
  selector: 'app-ai-advisor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ai-advisor.html',
  styleUrl: './ai-advisor.scss',
})
export class AiAdvisor implements OnInit {
  readonly quickPrompts = [
    'How can I increase my sales?',
    'Which products need attention?',
    'Help me reduce delivery costs',
  ];

  readonly messages = signal<ChatMessage[]>([
    {
      content: 'Hello! I am your merchant advisor. Ask me anything about your store performance.',
      sender: 'advisor',
      time: 'Now',
    },
  ]);
  readonly isReplying = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly questionForm = new FormGroup({
    question: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
  });

  constructor(private advisorService: AdvisorService, private changeDetectorRef: ChangeDetectorRef, public language: LanguageService) { }

  ngOnInit(): void {
    this.advisorService.getConversation().subscribe({
      next: (conversation) => {
        if (conversation.messages.length) {
          this.messages.set(conversation.messages.map((message) => ({
            content: message.content,
            sender: message.role,
            time: new Date(message.createdAt).toLocaleString(),
          })));
        }
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set('Could not load your previous advisor conversation.');
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  askQuestion(question?: string): void {
    const value = (question ?? this.questionForm.controls.question.value).trim();
    if (!value || this.isReplying()) return;

    this.messages.update((messages) => [
      ...messages,
      { content: value, sender: 'merchant', time: 'Now' },
    ]);
    this.questionForm.reset();
    this.isReplying.set(true);
    this.errorMessage.set(null);

    this.advisorService.ask(value, this.language.language()).subscribe({
      next: (response) => {
        this.messages.update((messages) => [
          ...messages,
          {
            content: response.answer,
            sender: 'advisor',
            time: 'Now',
          },
        ]);
        this.isReplying.set(false);
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.error || 'The advisor could not answer right now.');
        this.isReplying.set(false);
        this.changeDetectorRef.detectChanges();
      },
    });
  }
}
