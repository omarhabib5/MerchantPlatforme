import { ChangeDetectorRef, Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Expense, ExpenseService } from '../../../core/services/expense';
import { LanguageService } from '../../../core/services/language';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expenses.html',
  styleUrl: './expenses.scss',
})
export class ExpensesComponent implements OnInit {
  expenses = signal<Expense[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  showForm = signal(false);
  saving = signal(false);
  editingExpense = signal<Expense | null>(null);

  formModel: Partial<Expense> = this.emptyForm();

  totalExpenses = computed(() =>
    this.expenses().reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  );

  categoryTotals = computed(() => {
    const totals: Record<string, number> = {};
    for (const expense of this.expenses()) {
      const category = expense.category || 'other';
      totals[category] = (totals[category] || 0) + Number(expense.amount || 0);
    }
    return totals;
  });

  constructor(private expenseService: ExpenseService, private changeDetectorRef: ChangeDetectorRef, public language: LanguageService) { }

  ngOnInit() {
    this.loadExpenses();
  }

  loadExpenses() {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        this.expenses.set(expenses);
        this.loading.set(false);
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set(this.language.t('loadingExpenses'));
        this.loading.set(false);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  private emptyForm(): Partial<Expense> {
    return {
      title: '',
      category: 'publication',
      amount: undefined,
      notes: '',
      expenseDate: new Date().toISOString().slice(0, 10),
    };
  }

  openAddForm() {
    this.editingExpense.set(null);
    this.formModel = this.emptyForm();
    this.showForm.set(true);
    this.errorMessage.set(null);
  }

  openEditForm(expense: Expense) {
    this.editingExpense.set(expense);
    this.formModel = {
      ...expense,
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    };
    this.showForm.set(true);
    this.errorMessage.set(null);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingExpense.set(null);
    this.saving.set(false);
  }

  saveExpense() {
    if (!this.formModel.title || this.formModel.amount == null) {
      this.errorMessage.set(`${this.language.t('title')} and ${this.language.t('amount')} are required.`);
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const payload = {
      ...this.formModel,
      amount: Number(this.formModel.amount),
    };

    const request$ = this.editingExpense()?._id
      ? this.expenseService.updateExpense(this.editingExpense()!._id!, payload)
      : this.expenseService.createExpense(payload);

    request$.subscribe({
      next: () => {
        this.loadExpenses();
        this.closeForm();
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set('Could not save the expense. Please try again.');
        this.saving.set(false);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  deleteExpense(expense: Expense) {
    if (!expense._id) return;
    if (!confirm(`Delete expense "${expense.title}"?`)) return;

    this.expenseService.deleteExpense(expense._id).subscribe({
      next: () => {
        this.expenses.update((list) => list.filter((item) => item._id !== expense._id));
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set('Could not delete the expense. Please try again.');
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  formatCategory(category?: string): string {
    if (!category) return this.language.t('other');
    return this.language.t(category);
  }
}