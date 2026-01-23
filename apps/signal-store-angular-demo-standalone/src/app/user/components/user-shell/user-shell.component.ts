import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserFacade } from '../../state/user-facade.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-user-shell',
    templateUrl: './user-shell.component.html',
    styleUrls: ['./user-shell.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, NgIf],
})
export class UserShellComponent {
    userFacade = inject(UserFacade);
}
