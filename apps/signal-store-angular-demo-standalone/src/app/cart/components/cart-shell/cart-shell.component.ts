import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProductsFacade } from '../../../products/state/products-facade.service';
import { CurrencyPipe } from '@angular/common';

@Component({
    templateUrl: './cart-shell.component.html',
    styleUrls: ['./cart-shell.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CurrencyPipe],
})
export class CartShellComponent {
    productsFacade = inject(ProductsFacade);
}
