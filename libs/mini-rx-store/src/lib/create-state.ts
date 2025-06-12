import { BehaviorSubject, distinctUntilChanged, filter, map, Observable } from 'rxjs';
import { isKey } from '@mini-rx/common';

// Temporarily using an explicit ReturnType
// with `"noPropertyAccessFromIndexSignature": true` in the TS config this would not be necessary (it that case the return type is inferred like in signal store)
// however it would be a breaking change: see this failed test: https://github.com/mini-rx/mini-rx/actions/runs/15596826534/job/43929032692#step:6:170
// TODO look for a solution in the next major version of mini-rx-store
export type CreateSelectFnReturn<StateType extends object> = {
    (): Observable<StateType>;
    <R>(mapFn: (state: StateType) => R): Observable<R>;
    <KeyType extends keyof StateType>(key: KeyType): Observable<StateType[KeyType]>;
};

function createSelectFn<StateType extends object>(
    state$: Observable<StateType>
): CreateSelectFnReturn<StateType> {
    function select(): Observable<StateType>;
    function select<R>(mapFn: (state: StateType) => R): Observable<R>;
    function select<KeyType extends keyof StateType>(key: KeyType): Observable<StateType[KeyType]>;
    function select(mapFnOrKey?: any): Observable<any> {
        if (!mapFnOrKey) {
            return state$;
        }
        return state$.pipe(
            map((state) => {
                return isKey(state, mapFnOrKey) ? state[mapFnOrKey] : mapFnOrKey(state);
            }),
            distinctUntilChanged()
        );
    }

    return select;
}

export function createState<StateType extends object>(initialState: StateType) {
    const stateSource: BehaviorSubject<StateType> = new BehaviorSubject<StateType>(initialState);
    const state$: Observable<StateType> = stateSource.asObservable();

    function get(): StateType {
        return stateSource.value;
    }

    function set(v: StateType) {
        stateSource.next(v);
    }

    return {
        select: createSelectFn(state$),
        get,
        set,
    };
}

export function createLazyState<StateType extends object>(initialState?: StateType) {
    const stateSource: BehaviorSubject<StateType | undefined> = new BehaviorSubject<
        StateType | undefined
    >(initialState);
    const state$: Observable<StateType> = stateSource.asObservable().pipe(
        // Skip the first (undefined) value of the BehaviorSubject
        // Very similar to a ReplaySubject(1), but more lightweight
        // Emits a state object (when calling the `set` method)
        filter((v) => !!v)
    ) as Observable<StateType>;

    function get(): StateType | undefined {
        return stateSource.value;
    }

    function set(v: StateType) {
        stateSource.next(v);
    }

    return {
        select: createSelectFn(state$),
        get,
        set,
    };
}
