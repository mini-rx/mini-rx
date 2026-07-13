import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Todo } from '../models/todo';
import { Observable, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { altKeyPressed$ } from '../../../core/utils';

const todoApiUrl = 'api/todos/';
const failingTodoApiUrl = 'api/todos-not-ok';
let apiUrl = todoApiUrl;

altKeyPressed$.subscribe(updateApiUrl);

function updateApiUrl(altKeyPressed: boolean) {
    apiUrl = altKeyPressed ? failingTodoApiUrl : todoApiUrl;
}

@Injectable({
    providedIn: 'root',
})
export class TodosApiService {
    private http = inject(HttpClient);
    private toastr = inject(ToastrService);
    private errorHandler = inject(ErrorHandlerService);

    getTodos(): Observable<Todo[]> {
        return this.http.get<Todo[]>(todoApiUrl);
    }

    createTodo(todo: Todo): Observable<Todo> {
        return this.http.post<Todo>(apiUrl, todo).pipe(
            tap(() => this.toastr.success('Todo created')),
            catchError((err) => this.errorHandler.handleError(err))
        );
    }

    updateTodo(todo: Todo): Observable<Todo> {
        return this.http.put<Todo>(apiUrl + todo.id, todo).pipe(
            tap(() => this.toastr.success('Todo updated')),
            catchError((err) => this.errorHandler.handleError(err))
        );
    }

    deleteTodo(todo: Todo): Observable<void> {
        return this.http.delete<void>(apiUrl + todo.id).pipe(
            tap(() => this.toastr.success('Todo deleted')),
            catchError((err) => this.errorHandler.handleError(err))
        );
    }
}
