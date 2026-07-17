import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Todo } from '../../models/todo';

@Component({
    selector: 'app-todo-list',
    templateUrl: './todo-list.component.html',
    styleUrls: ['./todo-list.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class TodoListComponent {
    @Input()
    todos: Todo[] = [];

    @Input()
    selectedTodo: Todo | undefined;

    @Output()
    selectTodo = new EventEmitter<Todo>();
}
