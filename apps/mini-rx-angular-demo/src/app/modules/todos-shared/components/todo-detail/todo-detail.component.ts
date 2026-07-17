import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Todo } from '../../models/todo';

@Component({
    selector: 'app-todo-detail',
    templateUrl: './todo-detail.component.html',
    styleUrls: ['./todo-detail.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class TodoDetailComponent {
    @Input()
    todo!: Todo;

    @Output()
    create = new EventEmitter<Todo>();

    @Output()
    update = new EventEmitter<Todo>();

    @Output()
    delete = new EventEmitter<Todo>();

    @Output()
    closed = new EventEmitter<void>();

    submit() {
        if (this.todo.id) {
            this.update.emit(this.todo);
        } else {
            this.create.emit(this.todo);
        }
    }
}
