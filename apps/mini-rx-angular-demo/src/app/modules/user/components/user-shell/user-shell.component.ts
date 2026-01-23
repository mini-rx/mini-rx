import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserStore } from '../../state/user-store.service';

@Component({
    selector: 'app-user-shell',
    templateUrl: './user-shell.component.html',
    styleUrls: ['./user-shell.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class UserShellComponent {
    constructor(public userStore: UserStore) {}
}
