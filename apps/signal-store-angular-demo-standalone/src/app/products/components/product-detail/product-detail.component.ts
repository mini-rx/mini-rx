import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../models/product';
import { FormsModule, NgForm } from '@angular/forms';
import { Permissions } from '../../../user/state/user-facade.service';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-product-detail',
    templateUrl: './product-detail.component.html',
    styleUrls: ['./product-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, NgIf],
})
export class ProductDetailComponent {
    @Input()
    product!: Product;

    @Input()
    detailTitle!: string;

    @Input()
    permissions!: Permissions;

    @Output()
    create = new EventEmitter<Product>();

    @Output()
    update = new EventEmitter<Product>();

    @Output()
    delete = new EventEmitter<Product>();

    @Output()
    closed = new EventEmitter<void>();

    submit(form: NgForm) {
        const newProduct: Product = {
            ...this.product,
            ...form.value,
        };

        if (newProduct.id) {
            this.update.emit(newProduct);
        } else {
            this.create.emit(newProduct);
        }
    }
}
