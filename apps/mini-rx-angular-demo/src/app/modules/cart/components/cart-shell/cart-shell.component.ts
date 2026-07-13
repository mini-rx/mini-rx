import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProductsStore } from '../../../products/state/products-store.service';

@Component({
    templateUrl: './cart-shell.component.html',
    styleUrls: ['./cart-shell.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class CartShellComponent {
    productsStore = inject(ProductsStore);
}
