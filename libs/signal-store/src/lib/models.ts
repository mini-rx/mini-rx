import { Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Action, StateOrCallback } from '@mini-rx/common';

export interface ComponentStoreLike<StateType> {
    get state(): StateType;
    setState(stateOrCallback: StateOrCallback<StateType>, name?: string): void;
    connect(dict: Record<string, Observable<any> | Signal<any>>): void;
    rxEffect(effectFn: (origin$: Observable<any>) => Observable<any>): () => void;
    select<R>(mapFn?: (state: StateType) => R): Signal<R | StateType>;
    undo(action: Action): void;
}
