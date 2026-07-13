import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Todo } from '../../../todos-shared/models/todo';
import { map } from 'rxjs/operators';
import { cloneDeep } from 'lodash-es';
import { TodoFilter } from '../../../todos-shared/models/todo-filter';
import { TodosSimpleStore } from '../../state/todos-simple-store.service';

@Component({
    templateUrl: './todos-simple-shell.component.html',
    styleUrls: ['./todos-simple-shell.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class TodosSimpleShellComponent {
    todosSimpleStore = inject(TodosSimpleStore);

    todosDone$: Observable<Todo[]> = this.todosSimpleStore.todosDone$;
    todosNotDone$: Observable<Todo[]> = this.todosSimpleStore.todosNotDone$;
    selectedTodo$: Observable<Todo | undefined> = this.todosSimpleStore.selectedTodo$.pipe(
        map(cloneDeep) // Prevent [(ngModel)] from mutating the state
    );
    filter$: Observable<TodoFilter> = this.todosSimpleStore.filter$;
}
