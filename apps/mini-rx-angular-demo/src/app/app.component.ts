import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProductsStore } from './modules/products/state/products-store.service';
import { UserStore } from './modules/user/state/user-store.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class AppComponent {
    constructor(public productsStore: ProductsStore, public userStore: UserStore) {}
}
