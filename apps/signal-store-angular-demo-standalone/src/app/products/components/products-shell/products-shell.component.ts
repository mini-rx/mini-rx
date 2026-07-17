import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProductsFacade } from '../../state/products-facade.service';
import { UserFacade } from '../../../user/state/user-facade.service';
import { ProductListComponent } from '../product-list/product-list.component';
import { ProductDetailComponent } from '../product-detail/product-detail.component';
import { ProductFilterComponent } from '../product-filter/product-filter.component';

@Component({
    templateUrl: './products-shell.component.html',
    styleUrls: ['./products-shell.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ProductListComponent, ProductDetailComponent, ProductFilterComponent],
})
export class ProductsShellComponent {
    productsFacade = inject(ProductsFacade);
    userFacade = inject(UserFacade);
}
