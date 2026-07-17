import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TodosStore } from '../../state/todos-store.service';

@Component({
    templateUrl: './todos-shell.component.html',
    styleUrls: ['./todos-shell.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class TodosShellComponent {
    todosState = inject(TodosStore);
}
