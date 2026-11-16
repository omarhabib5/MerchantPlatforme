import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../../core/services/product';
import { LanguageService } from '../../../core/services/language';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class ProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  // Controls the add/edit form panel
  showForm = signal(false);
  editingProduct = signal<Product | null>(null);
  formModel: Partial<Product> = this.emptyForm();
  saving = signal(false);

  constructor(private productService: ProductService, private changeDetectorRef: ChangeDetectorRef, public language: LanguageService) { }

  ngOnInit() {
    this.loadProducts();
  }

  private normalizeProduct(product: Product): Product {
    return {
      ...product,
      buyingPrice: product.buyingPrice ?? 0,
      sellingPrice: product.sellingPrice ?? 0,
    };
  }

  loadProducts() {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products.map((product) => this.normalizeProduct(product)));
        this.loading.set(false);
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set("Couldn't load products. Try refreshing.");
        this.loading.set(false);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  private emptyForm(): Partial<Product> {
    return { name: '', description: '', buyingPrice: undefined, sellingPrice: undefined, stock: undefined, imageUrl: '' };
  }

  openAddForm() {
    this.editingProduct.set(null);
    this.formModel = this.emptyForm();
    this.showForm.set(true);
  }

  openEditForm(product: Product) {
    const normalized = this.normalizeProduct(product);
    this.editingProduct.set(normalized);
    this.formModel = {
      ...normalized,
      buyingPrice: normalized.buyingPrice,
      sellingPrice: normalized.sellingPrice,
    };
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingProduct.set(null);
  }

  saveProduct() {
    const buyingPrice = Number(this.formModel.buyingPrice ?? 0);
    const sellingPrice = Number(this.formModel.sellingPrice ?? 0);
    const stock = Number(this.formModel.stock ?? 0);

    if (!this.formModel.name || this.formModel.stock == null) {
      this.errorMessage.set('Name and stock are required.');
      return;
    }

    this.saving.set(true);
    const editing = this.editingProduct();
    const payload = {
      ...this.formModel,
      buyingPrice,
      sellingPrice,
      stock,
    };

    const request$ = editing?._id
      ? this.productService.updateProduct(editing._id, payload)
      : this.productService.createProduct(payload);

    request$.subscribe({
      next: () => {
        this.loadProducts();
        this.saving.set(false);
        this.closeForm();
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set('Could not save the product. Please try again.');
        this.saving.set(false);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  deleteProduct(product: Product) {
    if (!product._id) return;
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;

    this.productService.deleteProduct(product._id).subscribe({
      next: () => {
        this.products.update((list) => list.filter((p) => p._id !== product._id));
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.errorMessage.set('Could not delete the product. Please try again.');
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  stockLabel(product: Product): string {
    switch (product.stockStatus) {
      case 'out_of_stock':
        return 'Out of stock';
      case 'low_stock':
        return `Low stock — ${product.stock} left`;
      default:
        return `${product.stock} in stock`;
    }
  }
}