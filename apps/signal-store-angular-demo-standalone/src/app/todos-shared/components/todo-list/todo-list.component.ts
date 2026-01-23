import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Todo } from '../../models/todo';
import { CommonModule, NgClass } from '@angular/common';

@Component({
    selector: 'app-todo-list',
    templateUrl: './todo-list.component.html',
    styleUrls: ['./todo-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass, CommonModule],
})
export class TodoListComponent {
    @Input()
    todos: Todo[] = [];

    @Input()
    selectedTodo: Todo | undefined;

    @Output()
    selectTodo = new EventEmitter<Todo>();
}
