import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { Todo } from '../../../todos-shared/models/todo';
import { TodoFilter } from '../../../todos-shared/models/todo-filter';
import { TodosFacade } from '../../state/todos-facade.service';
import { TodoDetailComponent } from '../../../todos-shared/components/todo-detail/todo-detail.component';
import { TodoListComponent } from '../../../todos-shared/components/todo-list/todo-list.component';
import { TodoFilterComponent } from '../../../todos-shared/components/todo-filter/todo-filter.component';
import { NgIf } from '@angular/common';

@Component({
    templateUrl: './todos-shell.component.html',
    styleUrls: ['./todos-shell.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TodoDetailComponent, TodoListComponent, TodoFilterComponent, NgIf],
})
export class TodosShellComponent {
    todosFacade = inject(TodosFacade);

    todosDone: Signal<Todo[]> = this.todosFacade.todosDone;
    todosNotDone: Signal<Todo[]> = this.todosFacade.todosNotDone;
    selectedTodo: Signal<Todo | undefined> = computed(
        () => structuredClone(this.todosFacade.selectedTodo()) // Prevent [(ngModel)] from mutating the state
    );
    filter: Signal<TodoFilter> = this.todosFacade.filter;
}
