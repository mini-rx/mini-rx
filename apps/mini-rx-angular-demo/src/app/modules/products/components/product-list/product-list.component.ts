import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../models/product';

@Component({
    selector: 'app-product-list',
    templateUrl: './product-list.component.html',
    styleUrls: ['./product-list.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
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
