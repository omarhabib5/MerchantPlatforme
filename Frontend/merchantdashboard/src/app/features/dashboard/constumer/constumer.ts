import { ChangeDetectorRef, Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService, Customer } from '../../../core/services/Constumer';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './constumer.html',
  styleUrl: './constumer.scss',
})
export class CustomersComponent implements OnInit {
  customers = signal<Customer[]>([]);
  searchTerm = signal('');
  deletingCustomerId = signal<string | null>(null);
  riskCustomers = computed(() =>
    this.customers().filter((customer) => this.customerCategory(customer) !== 'Stable').length
  );
  filteredCustomers = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const results = search
      ? this.customers().filter((customer) =>
        customer.name.toLowerCase().includes(search) || customer.phone.toLowerCase().includes(search)
      )
      : this.customers();

    return [...results].sort((a, b) => {
      const aRisk = this.customerRiskScore(a);
      const bRisk = this.customerRiskScore(b);
      if (bRisk !== aRisk) return bRisk - aRisk;
      return b.rejectedOrders - a.rejectedOrders;
    });
  });
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  constructor(private customerService: CustomerService, private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.loading.set(true);
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set("Couldn't load customers. Try refreshing.");
        this.loading.set(false);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  updateSearch(value: string): void {
    this.searchTerm.set(value);
  }

  deleteCustomer(customerId: string): void {
    const confirmed = window.confirm('Delete this customer record?');
    if (!confirmed) return;

    this.deletingCustomerId.set(customerId);
    this.customerService.deleteCustomer(customerId).subscribe({
      next: () => {
        this.customers.update((list) => list.filter((customer) => customer._id !== customerId));
        this.deletingCustomerId.set(null);
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set('Could not delete the customer. Please try again.');
        this.deletingCustomerId.set(null);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  rejectionRate(customer: Customer): number {
    if (!customer.totalOrders) return 0;
    return Math.round((customer.rejectedOrders / customer.totalOrders) * 100);
  }

  customerRiskScore(customer: Customer): number {
    return customer.rejectedOrders * 5 + this.rejectionRate(customer);
  }

  customerCategory(customer: Customer): 'High rejection risk' | 'Needs follow-up' | 'Stable' {
    const rejectedOrders = customer.rejectedOrders;
    const rejectionRate = this.rejectionRate(customer);

    if (rejectedOrders >= 3 || rejectionRate >= 50) return 'High rejection risk';
    if (rejectedOrders >= 1 || rejectionRate >= 25) return 'Needs follow-up';
    return 'Stable';
  }
}