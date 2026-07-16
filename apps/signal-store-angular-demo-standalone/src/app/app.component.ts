import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProductsFacade } from './products/state/products-facade.service';
import { UserFacade } from './user/state/user-facade.service';

@Component({
    imports: [RouterModule],
    selector: 'app-root',
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    productsFacade = inject(ProductsFacade);
    userFacade = inject(UserFacade);
}
