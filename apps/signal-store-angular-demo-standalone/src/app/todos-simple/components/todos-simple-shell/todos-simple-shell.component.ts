import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { Todo } from '../../../todos-shared/models/todo';
import { TodoFilter } from '../../../todos-shared/models/todo-filter';
import { TodosSimpleFacade } from '../../state/todos-simple-facade.service';
import { TodoDetailComponent } from '../../../todos-shared/components/todo-detail/todo-detail.component';
import { TodoFilterComponent } from '../../../todos-shared/components/todo-filter/todo-filter.component';
import { TodoListComponent } from '../../../todos-shared/components/todo-list/todo-list.component';
import { CommonModule } from '@angular/common';

@Component({
    imports: [TodoDetailComponent, TodoFilterComponent, TodoListComponent, CommonModule],
    templateUrl: './todos-simple-shell.component.html',
    styleUrls: ['./todos-simple-shell.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodosSimpleShellComponent {
    todosSimpleFacade = inject(TodosSimpleFacade);

    todosDone: Signal<Todo[]> = this.todosSimpleFacade.todosDone;
    todosNotDone: Signal<Todo[]> = this.todosSimpleFacade.todosNotDone;
    selectedTodo: Signal<Todo | undefined> = computed(() => {
        return structuredClone(this.todosSimpleFacade.selectedTodo());
    });
    filter: Signal<TodoFilter> = this.todosSimpleFacade.filter;
}
