import { Injectable, inject } from '@angular/core';
import { Todo } from '../../todos-shared/models/todo';
import { TodoFilter } from '../../todos-shared/models/todo-filter';
import { pipe } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import {
    Action,
    createFeatureSelector,
    createSelector,
    FeatureStore,
    tapResponse,
} from 'mini-rx-store';
import { TodosApiService } from '../../todos-shared/services/todos-api.service';
import { cloneDeep } from 'lodash-es';

// STATE INTERFACE
interface TodosState {
    todos: Todo[];
    filter: TodoFilter;
    selectedTodo: Todo | undefined;
}

// INITIAL STATE
const initialState: TodosState = {
    todos: [],
    selectedTodo: undefined,
    filter: {
        search: '',
        category: {
            isBusiness: false,
            isPrivate: false,
        },
    },
};

// MEMOIZED SELECTORS
const getTodosFeatureSelector = createFeatureSelector<TodosState>();
const getTodos = createSelector(getTodosFeatureSelector, (state) => state.todos);
const getSelectedTodo = createSelector(getTodosFeatureSelector, (state) =>
    cloneDeep(state.selectedTodo)
);
const getFilter = createSelector(getTodosFeatureSelector, (state) => state.filter);
const getTodosFiltered = createSelector(getTodos, getFilter, (todos, filter) => {
    return todos.filter((item) => {
        return (
            item.title.toUpperCase().indexOf(filter.search.toUpperCase()) > -1 &&
            (filter.category.isBusiness ? item.isBusiness : true) &&
            (filter.category.isPrivate ? item.isPrivate : true)
        );
    });
});
const getTodosDone = createSelector(getTodosFiltered, (todos) =>
    todos.filter((todo) => todo.isDone)
);
const getTodosNotDone = createSelector(getTodosFiltered, (todos) =>
    todos.filter((todo) => !todo.isDone)
);
const getVm = createSelector({
    todosDone: getTodosDone,
    todosNotDone: getTodosNotDone,
    filter: getFilter,
    selectedTodo: getSelectedTodo,
});

@Injectable({
    providedIn: 'root',
})
export class TodosStore extends FeatureStore<TodosState> {
    private apiService = inject(TodosApiService);

    // STATE OBSERVABLES
    vm$ = this.select(getVm);

    constructor() {
        super('todos', initialState);

        this.load();
    }

    // UPDATE STATE
    selectTodo(todo: Todo) {
        this.setState({ selectedTodo: todo }, 'selectTodo');
    }

    initNewTodo() {
        const newTodo = new Todo();
        newTodo.tempId = uuid();
        this.setState({ selectedTodo: newTodo }, 'initNewTodo');
    }

    clearSelectedTodo() {
        this.setState(
            {
                selectedTodo: undefined,
            },
            'clearSelectedTodo'
        );
    }

    updateFilter(filter: TodoFilter) {
        this.setState(
            (state) => ({
                filter: {
                    ...state.filter,
                    ...filter,
                },
            }),
            'updateFilter'
        );
    }

    // API CALLS...
    // Effect using the RxJS standalone pipe
    load = this.effect<void>(
        pipe(
            mergeMap(() =>
                this.apiService.getTodos().pipe(
                    tapResponse(
                        (todos) => this.setState({ todos }, 'loadSuccess'),
                        (err) => {
                            console.error(err);
                        }
                    )
                )
            )
        )
    );

    // Effect + optimistic update / undo
    // We can skip the standalone pipe when using just one RxJS operator
    create = this.effect<Todo>(
        mergeMap((todo) => {
            const optimisticUpdate: Action = this.setState((state) => {
                // Create a new Todo object to prevent the Immutable Extension from making the current form model immutable
                // This is only a concern if the create call fails (A successful create call would return a new Todo object)
                const newTodo: Todo = { ...todo };
                return {
                    todos: [...state.todos, newTodo],
                };
            }, 'createOptimistic');

            return this.apiService.createTodo(todo).pipe(
                tapResponse(
                    (createdTodo) => {
                        this.setState(
                            (state) => ({
                                todos: state.todos.map((item) =>
                                    item.tempId === todo.tempId ? createdTodo : item
                                ),
                                selectedTodo: createdTodo,
                            }),
                            'createSuccess'
                        );
                    },
                    (err) => {
                        console.error(err);
                        this.undo(optimisticUpdate);
                    }
                )
            );
        })
    );

    // Classic subscribe + optimistic update / undo
    update(todo: Todo) {
        const optimisticUpdate: Action = this.setState(
            (state) => ({
                todos: updateTodoInList(state.todos, todo),
            }),
            'updateOptimistic'
        );

        this.apiService.updateTodo(todo).subscribe({
            next: (updatedTodo) => {
                this.setState(
                    (state) => ({
                        todos: updateTodoInList(state.todos, updatedTodo),
                    }),
                    'updateSuccess'
                );
            },
            error: (err) => {
                console.error(err);
                this.undo(optimisticUpdate);
            },
        });
    }

    // Classic subscribe + optimistic update / undo
    delete(todo: Todo) {
        const optimisticUpdate: Action = this.setState(
            (state) => ({
                selectedTodo: undefined,
                todos: state.todos.filter((item) => item.id !== todo.id),
            }),
            'deleteOptimistic'
        );

        this.apiService.deleteTodo(todo).subscribe({
            error: (err) => {
                console.error(err);
                this.undo(optimisticUpdate);
            },
        });
    }
}

function updateTodoInList(todos: Todo[], updatedTodo: Todo): Todo[] {
    return todos.map((item) =>
        item.id === updatedTodo.id
            ? {
                  ...item,
                  ...updatedTodo,
              }
            : item
    );
}
