import { ChangeDetectorRef, Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../../core/services/order';
import { ProductService, Product } from '../../../core/services/product';
import { CustomerService } from '../../../core/services/Constumer';
import { LanguageService } from '../../../core/services/language';

type StatusFilter = 'all' | Order['status'];

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class OrdersComponent implements OnInit {
  orders = signal<Order[]>([]);
  products = signal<Product[]>([]);
  loading = signal(true);
  importing = signal(false);
  errorMessage = signal<string | null>(null);
  activeFilter = signal<StatusFilter>('all');

  // List of statuses shown as filter tabs, in the order a merchant thinks about them
  readonly statusFilters: StatusFilter[] = [
    'all',
    'pending',
    'confirmed',
    'shipped',
    'delivered',
    'rejected',
  ];

  filteredOrders = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.orders();
    return this.orders().filter((o) => o.status === filter);
  });



  // New order form state
  showForm = signal(false);
  saving = signal(false);
  confirmDeleteOpen = signal(false);
  pendingDeleteOrder = signal<Partial<Order> | null>(null);
  formModel: Partial<Order> = this.emptyForm();

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private customerService: CustomerService,
    private changeDetectorRef: ChangeDetectorRef,
    public language: LanguageService
  ) { }

  ngOnInit() {
    this.loadOrders();
    this.loadProducts();
  }

  loadOrders() {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set("Couldn't load orders. Try refreshing.");
        this.loading.set(false);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  importFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.importing.set(true);
    this.errorMessage.set(null);
    this.orderService.importOrders(file).subscribe({
      next: (result) => {
        this.orders.update((list) => [...result.orders, ...list]);
        this.importing.set(false);
        if (result.skipped.length) {
          this.errorMessage.set(`${result.imported} طلب مستورد، وتم تخطي ${result.skipped.length} صف.`);
        }
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.importing.set(false);
        this.errorMessage.set(error.error?.error || 'تعذر استيراد ملف الطلبات.');
        this.changeDetectorRef.detectChanges();
      },
    });
  }
  updateorders(order: Partial<Order>) {
    if (!order._id) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const payload = this.sanitizeOrderPayload(order);
    this.orderService.updateOrder(order._id, payload).subscribe({
      next: (updated) => {
        this.orders.update((list) => list.map((o) => (o._id === updated._id ? updated : o)));
        this.saving.set(false);
        this.closeForm();
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Could not update the order. Please try again.');
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  Deleteorders(order: Partial<Order>) {
    if (!order._id) return;

    this.pendingDeleteOrder.set(order);
    this.errorMessage.set(null);
    this.confirmDeleteOpen.set(true);
  }

  cancelDelete() {
    this.confirmDeleteOpen.set(false);
    this.pendingDeleteOrder.set(null);
  }

  confirmDeleteOrder() {
    const order = this.pendingDeleteOrder();
    if (!order?._id) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    this.orderService.deleteOrder(order._id).subscribe({
      next: () => {
        this.orders.update((list) => list.filter((o) => o._id !== order._id));
        this.saving.set(false);
        this.confirmDeleteOpen.set(false);
        this.pendingDeleteOrder.set(null);
        this.closeForm();
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Could not delete the order. Please try again.');
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  loadProducts() {
    // Used to populate the product dropdown in the "New order" form
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.changeDetectorRef.detectChanges();
      },
      error: () => { }, // non-fatal — form still works, just without a product list
    });
  }

  setFilter(filter: StatusFilter) {
    this.activeFilter.set(filter);
  }

  updateStatus(order: Order, newStatus: Order['status']) {
    if (!order._id) return;
    const previous = order.status;
    // Optimistic update — reflect the change immediately, revert if the API call fails
    this.orders.update((list) =>
      list.map((o) => (o._id === order._id ? { ...o, status: newStatus } : o))
    );

    this.orderService.updateStatus(order._id, newStatus).subscribe({
      error: () => {
        this.orders.update((list) =>
          list.map((o) => (o._id === order._id ? { ...o, status: previous } : o))
        );
        this.errorMessage.set('Could not update the order status. Please try again.');
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  productName(order: Order): string {
    if (order.productId && typeof order.productId === 'object') {
      return order.productId.name;
    }

    if (typeof order.productId === 'string') {
      const product = this.products().find((item) => item._id === order.productId);
      return product?.name ?? '—';
    }

    return '—';
  }

  // Next logical status for the "advance" quick-action button, based on current status
  nextStatus(status: Order['status']): Order['status'] | null {
    const flow: Record<Order['status'], Order['status'] | null> = {
      pending: 'confirmed',
      confirmed: 'shipped',
      shipped: 'delivered',
      delivered: null,
      rejected: null,
    };
    return flow[status];
  }

  private emptyForm(): Partial<Order> {
    return {
      customerName: '',
      customerPhone: '',
      address: '',
      quantity: 1,
      productId: undefined,
      status: 'pending',
    };
  }

  openAddForm() {
    this.formModel = this.emptyForm();
    this.errorMessage.set(null);
    this.showForm.set(true);
  }

  openUpdateForm(order: Order) {
    this.formModel = this.buildFormModel(order);
    this.errorMessage.set(null);
    this.showForm.set(true);
  }

  // Called when the phone field changes in the create/update form.
  // If a known customer exists for this phone, autofill their name and address.
  onPhoneChange(phone: string) {
    if (!phone) return;
    this.customerService.lookupByPhone(phone).subscribe({
      next: (cust) => {
        if (!cust) return;
        this.formModel.customerName = cust.name || this.formModel.customerName;
        if (!this.formModel.address && cust.address) this.formModel.address = cust.address;
      },
      error: () => {
        // silently ignore lookup errors
      },
    });
  }

  closeForm() {
    this.saving.set(false);
    this.showForm.set(false);
  }

  saveOrder() {
    if (!this.formModel.customerName || !this.formModel.customerPhone || !this.formModel.address) {
      this.errorMessage.set('Customer name, phone, and address are required.');
      return;
    }

    const customerName = this.formModel.customerName.trim();
    const customerPhone = this.formModel.customerPhone.trim();

    if (this.hasPreviousRejectedOrder(customerName, customerPhone)) {
      window.alert(
        `Warning: ${customerName} (${customerPhone}) has a rejected order recorded before. Please review before creating a new order.`
      );
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const payload = this.sanitizeOrderPayload({
      ...this.formModel,
      customerName,
      customerPhone,
      source: 'manual',
    });

    this.orderService.createOrder(payload).subscribe({
      next: (created) => {
        this.orders.update((list) => [created, ...list]);
        this.saving.set(false);
        this.closeForm();
      },
      error: () => {
        this.errorMessage.set('Could not create the order. Please try again.');
        this.saving.set(false);
      },
    });
  }

  private hasPreviousRejectedOrder(customerName: string, customerPhone: string): boolean {
    if (!customerName || !customerPhone) return false;

    const normalizedName = customerName.trim().toLowerCase();
    const normalizedPhone = customerPhone.trim().toLowerCase();

    return this.orders().some((order) => {
      if (order.status !== 'rejected') return false;

      const sameName = (order.customerName || '').trim().toLowerCase() === normalizedName;
      const samePhone = (order.customerPhone || '').trim().toLowerCase() === normalizedPhone;

      return sameName && samePhone;
    });
  }

  private buildFormModel(order: Order): Partial<Order> {
    return {
      ...order,
      productId: this.normalizeProductId(order.productId),
    };
  }

  private normalizeProductId(productId: Order['productId']): string | undefined {
    if (!productId) return undefined;
    if (typeof productId === 'string') return productId;
    if (typeof productId === 'object' && '_id' in productId) return productId._id;
    return undefined;
  }

  private sanitizeOrderPayload(order: Partial<Order>): Partial<Order> {
    const payload: Partial<Order> = { ...order };
    const normalizedProductId = this.normalizeProductId(order.productId);

    if (normalizedProductId) {
      payload.productId = normalizedProductId;
    } else {
      payload.productId = undefined;
    }

    if (payload.quantity === undefined || payload.quantity < 1) {
      payload.quantity = 1;
    }

    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.merchantId;

    return payload;
  }
}