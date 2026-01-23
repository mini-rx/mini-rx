import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProductsFacade } from '../../../products/state/products-facade.service';
import { CurrencyPipe, NgForOf, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';

@Component({
    templateUrl: './cart-shell.component.html',
    styleUrls: ['./cart-shell.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgSwitch, CurrencyPipe, NgForOf, NgIf, NgSwitchCase],
})
export class CartShellComponent {
    productsFacade = inject(ProductsFacade);
}
