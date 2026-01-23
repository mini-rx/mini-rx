import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProductsStore } from '../../state/products-store.service';
import { UserStore } from '../../../user/state/user-store.service';

@Component({
    templateUrl: './products-shell.component.html',
    styleUrls: ['./products-shell.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class ProductsShellComponent {
    constructor(public productsStore: ProductsStore, public userStore: UserStore) {}
}
