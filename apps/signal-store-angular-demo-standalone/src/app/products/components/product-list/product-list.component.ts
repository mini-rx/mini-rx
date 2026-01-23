import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../models/product';
import { CurrencyPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-product-list',
    templateUrl: './product-list.component.html',
    styleUrls: ['./product-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CurrencyPipe, NgClass, FormsModule, NgForOf, NgIf],
})
export class ProductListComponent {
    @Input()
    products: Product[] = [];

    @Input()
    selectedProduct: Product | undefined;

    @Input()
    displayCode = false;

    @Input()
    showCartBtn = false;

    @Output()
    productSelect = new EventEmitter<Product>();

    @Output()
    displayCodeChange = new EventEmitter<boolean>();

    @Output()
    addToCart = new EventEmitter<Product>();
}
