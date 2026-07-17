import { TestBed } from '@angular/core/testing';
import { StoreModule } from '../store.module';
import {
    Action,
    Actions,
    createComponentStore,
    createEffect,
    FeatureStore,
    ofType,
    Reducer,
    ReduxDevtoolsExtension,
    Store,
    StoreExtension,
} from 'mini-rx-store';
import { Injectable, NgModule, inject as inject_1 } from '@angular/core';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { EffectsModule } from '../effects.module';
import { ComponentStoreModule } from '../component-store.module';
import { NgReduxDevtoolsExtension } from '../ng-redux-devtools.extension';
import { ComponentStoreExtension, MetaReducer } from '@mini-rx/common';
jest.mock('../ng-redux-devtools.extension'); // is now a mock constructor
const loadAction: Action = {
    type: 'LOAD',
};
const loadAction2: Action = {
    type: 'LOAD_2',
};
const loadAction3: Action = {
    type: 'LOAD_3',
};
const loadSuccessAction: Action = {
    type: 'LOAD_SUCCESS',
};
const loadSuccessAction2: Action = {
    type: 'LOAD_SUCCESS_2',
};
const loadSuccessAction3: Action = {
    type: 'LOAD_SUCCESS_3',
};
const loadFailAction: Action = {
    type: 'LOAD_FAIL',
};
interface CounterState {
    counter: number;
}
interface StringState {
    value: string;
}
const counterInitialState: CounterState = {
    counter: 1,
};
function counterReducer(state: CounterState = counterInitialState, action: Action) {
    switch (action.type) {
        case 'counter':
            return {
                ...state,
                counter: state.counter + 1,
            };
        default:
            return state;
    }
}
@NgModule({
    imports: [StoreModule.forFeature<CounterState>('counter2', counterReducer)],
})
class Counter4Module {}
const featureMetaReducerSpy = jest.fn();
function featureMetaReducer(reducer: Reducer<any>): Reducer<any> {
    return (state, action) => {
        featureMetaReducerSpy(state);
        return reducer(state, action);
    };
}
@NgModule({
    imports: [
        StoreModule.forFeature<CounterState>('counter3', counterReducer, {
            initialState: {
                counter: 555,
            },
            metaReducers: [featureMetaReducer],
        }),
    ],
})
class Counter5Module {}
@Injectable()
export class TodoEffects {
    private actions$ = inject_1(Actions);

    loadTodos$ = createEffect(
        this.actions$.pipe(
            ofType(loadAction.type),
            mergeMap(() =>
                of('some result').pipe(
                    map((res) => loadSuccessAction),
                    catchError((err) => of(loadFailAction))
                )
            )
        )
    );
    nonDispatchingEffect$ = createEffect(
        this.actions$.pipe(
            ofType(loadAction2.type),
            mergeMap(() => of('some result').pipe(map((res) => loadSuccessAction2)))
        ),
        { dispatch: false }
    );
}
@Injectable()
export class TodoEffectsNOK {
    private actions$ = inject_1(Actions);

    // Effect is not registered because it is not using createEffect!
    loadTodos$ = this.actions$.pipe(
        ofType(loadAction3.type),
        mergeMap(() => of('some result').pipe(map((res) => loadSuccessAction3)))
    );
}
class CounterFeatureStore extends FeatureStore<CounterState> {
    constructor() {
        super('counterFs', counterInitialState);
    }
    inc() {
        this.setState((state) => ({
            counter: state.counter + 1,
        }));
    }
}
const reduxDevToolsExtension = new ReduxDevtoolsExtension({ name: 'Test Redux DevTools' });
const stateFromReduxDevTools = {
    someProp: 'someValue',
};
describe(`Ng Modules`, () => {
    let actions$: Actions;
    let store: Store;
    const rootMetaReducerSpy = jest.fn();
    function rootMetaReducer(reducer: Reducer<any>): Reducer<any> {
        return (state, action) => {
            rootMetaReducerSpy(state);
            return reducer(state, action);
        };
    }
    const extensionSpy = jest.fn();
    class SomeExtension extends StoreExtension {
        id = 1; // id does not matter, but it has to be implemented
        init(): void {
            extensionSpy();
        }
    }
    function metaReducerForLocalCsExtension(reducer: Reducer<StringState>): Reducer<StringState> {
        return (state, action) => {
            if (Object.hasOwn(action, 'stateOrCallback')) {
                state = {
                    ...state,
                    value: state.value + 'local',
                };
            }
            return reducer(state, action);
        };
    }
    class LocalCsExtension extends StoreExtension implements ComponentStoreExtension {
        id = 1;
        hasCsSupport = true as const;
        init(): MetaReducer<StringState> {
            return metaReducerForLocalCsExtension;
        }
    }
    function metaReducerForGlobalCsExtension(reducer: Reducer<StringState>): Reducer<StringState> {
        return (state, action) => {
            if (Object.hasOwn(action, 'stateOrCallback')) {
                state = {
                    ...state,
                    value: state.value + 'global',
                };
            }
            return reducer(state, action);
        };
    }
    class GlobalCsExtension extends StoreExtension implements ComponentStoreExtension {
        id = 2;
        hasCsSupport = true as const;
        init(): MetaReducer<StringState> {
            return metaReducerForGlobalCsExtension;
        }
    }
    beforeAll(() => {
        TestBed.configureTestingModule({
            imports: [
                Counter4Module,
                EffectsModule.register([TodoEffects, TodoEffectsNOK]),
                StoreModule.forRoot({
                    reducers: {
                        counter1: counterReducer,
                    },
                    initialState: {
                        counter1: { counter: 111 },
                    },
                    metaReducers: [rootMetaReducer],
                    extensions: [new SomeExtension(), reduxDevToolsExtension],
                }),
                Counter5Module,
                ComponentStoreModule.forRoot({
                    extensions: [new GlobalCsExtension()],
                }),
            ],
        });
        actions$ = TestBed.inject(Actions);
        store = TestBed.inject(Store);
    });
    it(`should provide Store`, () => {
        expect(store).toBeTruthy();
    });
    it(`should initialize Store`, () => {
        const spy = jest.fn();
        store.select((state) => state).subscribe(spy);
        expect(spy).toHaveBeenCalledWith({
            counter1: { counter: 111 }, // Reducer initial state is overwritten by initial state from forRoot config
            counter2: { counter: 1 },
            counter3: { counter: 555 }, // forFeature config initial state
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(rootMetaReducerSpy).toHaveBeenCalledTimes(3);
        expect(featureMetaReducerSpy).toHaveBeenCalledTimes(1);
        expect(extensionSpy).toHaveBeenCalledTimes(1);
    });
    it(`should provide Actions`, () => {
        expect(actions$).toBeTruthy();
    });
    it(`should update state`, () => {
        const spy = jest.fn();
        store.dispatch({ type: 'counter' });
        store.select((state) => state).subscribe(spy);
        expect(spy).toHaveBeenCalledWith({
            counter1: { counter: 112 },
            counter2: { counter: 2 },
            counter3: { counter: 556 },
        });
        expect(rootMetaReducerSpy).toHaveBeenCalledTimes(4);
        expect(featureMetaReducerSpy).toHaveBeenCalledTimes(2);
    });
    it(`should run effect`, () => {
        const spy = jest.fn();
        actions$.subscribe(spy);
        store.dispatch(loadAction);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(loadAction);
        expect(spy).toHaveBeenCalledWith(loadSuccessAction);
    });
    it(`should run non-dispatching effect`, () => {
        const spy = jest.fn();
        actions$.subscribe(spy);
        store.dispatch(loadAction2);
        expect(spy).toHaveBeenCalledWith(loadAction2);
        expect(spy).not.toHaveBeenCalledWith(loadSuccessAction);
    });
    it(`should NOT run effects from TodoEffectsNOK`, () => {
        const spy = jest.fn();
        actions$.subscribe(spy);
        store.dispatch(loadAction3);
        expect(spy).toHaveBeenCalledWith(loadAction3);
        expect(spy).not.toHaveBeenCalledWith(loadSuccessAction3);
    });
    describe(`FeatureStore`, () => {
        let fs: CounterFeatureStore;
        it(`should add Feature Store`, () => {
            fs = new CounterFeatureStore();
            const spy = jest.fn();
            store.select((state) => state).subscribe(spy);
            expect(spy).toHaveBeenCalledWith({
                counter1: { counter: 112 },
                counterFs: { counter: 1 },
                counter2: { counter: 2 },
                counter3: { counter: 556 },
            });
        });
        it(`should update state`, () => {
            const spy = jest.fn();
            fs.inc();
            store.select((state) => state).subscribe(spy);
            expect(spy).toHaveBeenCalledWith({
                counter1: { counter: 112 },
                counterFs: { counter: 2 },
                counter2: { counter: 2 },
                counter3: { counter: 556 },
            });
        });
    });
    describe(`ComponentStore`, () => {
        // Just make sure that the global config is set via the ComponentStoreModule.forRoot static method
        // For the other aspects of the config we can rely on the ComponentStore tests
        it('should merge global config with local config', () => {
            const spy = jest.fn();
            const cs = createComponentStore<StringState>(
                { value: 'a' },
                { extensions: [new LocalCsExtension()] }
            );
            cs.select((state) => state.value).subscribe(spy);
            expect(spy).toHaveBeenCalledWith('a');
            cs.setState((state) => ({ value: state.value + 'b' }));
            cs.select((state) => state.value).subscribe(spy);
            expect(spy).toHaveBeenCalledWith('alocalglobalb');
        });
    });
    describe(`Redux DevTools extension`, () => {
        it('should initialize NgReduxDevtoolsExtension', () => {
            expect(NgReduxDevtoolsExtension).toHaveBeenCalledWith({
                name: 'Test Redux DevTools',
                traceLimit: 25,
            });
        });
        it('should update the Store state', () => {
            JSON.parse = jest.fn().mockImplementationOnce((data) => {
                return data;
            });
            reduxDevToolsExtension['onDevToolsMessage']({
                type: 'DISPATCH',
                payload: {
                    type: 'JUMP_TO_STATE',
                },
                state: stateFromReduxDevTools,
            });
            const spy = jest.fn();
            store.select((state) => state).subscribe(spy);
            expect(spy).toHaveBeenCalledWith(stateFromReduxDevTools);
            spy.mockReset();
            reduxDevToolsExtension['onDevToolsMessage']({
                type: 'NOT_SUPPORTED_TYPE',
                payload: {},
                state: {},
            });
            expect(spy).toHaveBeenCalledTimes(0);
        });
    });
});
