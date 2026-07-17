import { Store } from '../store';
import {
    Action,
    Actions,
    AppState,
    createRxEffect,
    ExtensionId,
    FeatureConfig,
    MetaReducer,
    ofType,
    Reducer,
    StoreConfig,
    StoreExtension,
} from '@mini-rx/common';
import { createFeatureStateSelector, createSelector } from '../signal-selector';
import { catchError, map, mergeMap, Observable, of, take, tap } from 'rxjs';
import { cold, hot } from 'jest-marbles';
import { FeatureStore } from '../feature-store';
import {
    counterInitialState,
    counterReducer,
    CounterState,
    createUniqueAction,
    destroyStore,
} from './_spec-helpers';
import { TestBed } from '@angular/core/testing';
import { StoreModule } from '../modules/store.module';
import { rxEffect, storeCore } from '../store-core';
interface ActionWithPayload extends Action {
    payload?: any;
}
const asyncUser: Partial<UserState> = {
    firstName: 'Steven',
    lastName: 'Seagal',
    age: 30,
};
const updatedAsyncUser: Partial<UserState> = {
    firstName: 'Steven',
    lastName: 'Seagal',
    age: 31,
};
function fakeApiGet(): Observable<UserState> {
    return cold('---a', { a: asyncUser });
}
function fakeApiUpdate(): Observable<UserState> {
    return cold('-a', { a: updatedAsyncUser });
}
function fakeApiWithError(): Observable<UserState> {
    return cold('-#');
}
interface UserState {
    firstName: string;
    lastName: string;
    age: number;
    err: string | undefined;
}
const userInitialState: UserState = {
    firstName: 'Bruce',
    lastName: 'Willis',
    age: 30,
    err: undefined,
};
function userReducer(state: UserState = userInitialState, action: ActionWithPayload): UserState {
    switch (action.type) {
        case 'updateUser':
        case 'loadUserSuccess':
        case 'saveUserSuccess':
            return {
                ...state,
                ...action.payload,
            };
        case 'incAge':
            return {
                ...state,
                age: state.age + 1,
            };
        case 'error':
            return {
                ...state,
                err: action.payload,
            };
        default:
            return state;
    }
}
const getUserFeatureState = createFeatureStateSelector<UserState>('user');
const getFirstName = createSelector(getUserFeatureState, (user) => user.firstName);
const getAge = createSelector(getUserFeatureState, (user) => user.age);
class CounterFeatureStore extends FeatureStore<CounterState> {
    constructor() {
        super('counterFs', counterInitialState);
    }
    increment() {
        this.setState((state) => ({ counter: state.counter + 1 }));
    }
}
let store: Store;
let actions: Actions;
function setup(
    storeConfig: StoreConfig<AppState> = {},
    feature?: {
        key: string;
        reducer: Reducer<any>;
        config?: Partial<FeatureConfig<any>>;
    }
): void {
    let moduleImports: any[] = [StoreModule.forRoot(storeConfig)];
    if (feature) {
        moduleImports = [
            ...moduleImports,
            StoreModule.forFeature(feature.key, feature.reducer, feature.config),
        ];
    }
    TestBed.configureTestingModule({
        imports: moduleImports,
    });
    store = TestBed.inject(Store);
    actions = TestBed.inject(Actions);
}
describe('Store Config', () => {
    afterEach(() => {
        destroyStore();
    });
    it('should initialize the store with an empty object', () => {
        setup();
        const selectedState = store.select((state) => state);
        expect(selectedState()).toEqual({});
    });
    it('should dispatch an initial action', () => {
        const spy = jest.fn();
        actions.subscribe(spy);
        setup();
        expect(spy).toHaveBeenCalledWith({ type: '@mini-rx/init' });
    });
    it('should initialize the store with an empty object when root reducers have no initial state', () => {
        setup({
            reducers: {
                test: (state) => {
                    return state;
                },
            },
        });
        const selectedState = store.select((state) => state);
        expect(selectedState()).toEqual({});
    });
    it('should initialize a Feature state with a root reducer', () => {
        setup({
            reducers: { user: userReducer },
        });
        const selectedState = store.select((state) => state);
        expect(selectedState()).toEqual({
            user: userInitialState,
        });
    });
    it('should initialize the store with root initial state', () => {
        const rootInitialState = {
            user: { name: 'Nicolas' },
        };
        setup({
            initialState: rootInitialState,
            reducers: {
                user: userReducer,
                user2: userReducer,
            },
        });
        const selectedState = store.select((state) => state);
        expect(selectedState()).toEqual({
            user: { name: 'Nicolas' }, // userReducer initial state is overwritten by the root initial state
            user2: userInitialState, // Root initial state does not affect User2 initial state
        });
    });
    describe('Root Meta Reducers', () => {
        const nextStateSpy = jest.fn();
        it('should call root meta reducer with root initial state', () => {
            const rootMetaReducerSpy = jest.fn();
            const rootInitialState = {
                user: {},
            };
            function rootMetaReducer1(reducer: Reducer<AppState>): Reducer<AppState> {
                return (state, action) => {
                    rootMetaReducerSpy(state);
                    return reducer(state, action);
                };
            }
            setup({
                metaReducers: [rootMetaReducer1],
                initialState: rootInitialState,
            });
            expect(rootMetaReducerSpy).toHaveBeenCalledWith(rootInitialState);
        });
        it('should call root meta reducers from left to right', () => {
            const callOrder: string[] = [];
            function rootMetaReducer1(reducer: Reducer<AppState>): Reducer<AppState> {
                return (state, action) => {
                    callOrder.push('meta1');
                    return reducer(state, action);
                };
            }
            function rootMetaReducer2(reducer: Reducer<AppState>): Reducer<AppState> {
                return (state, action) => {
                    callOrder.push('meta2');
                    return reducer(state, action);
                };
            }
            setup({
                metaReducers: [rootMetaReducer1, rootMetaReducer2],
            });
            expect(callOrder).toEqual(['meta1', 'meta2']);
        });
        it('should call root meta reducers from extensions depending on sortOrder', () => {
            const callOrder: string[] = [];
            function rootMetaReducerForExtension(reducer: Reducer<AppState>): Reducer<AppState> {
                return (state, action) => {
                    callOrder.push('meta1');
                    return reducer(state, action);
                };
            }
            class Extension extends StoreExtension {
                id = ExtensionId.LOGGER; // id does not matter, but it has to be implemented
                override sortOrder = 3;
                init(): MetaReducer<AppState> {
                    return rootMetaReducerForExtension;
                }
            }
            function rootMetaReducerForExtension2(reducer: Reducer<AppState>): Reducer<AppState> {
                return (state, action) => {
                    callOrder.push('meta2');
                    return reducer(state, action);
                };
            }
            class Extension2 extends StoreExtension {
                id = ExtensionId.LOGGER; // id does not matter, but it has to be implemented
                override sortOrder = 2;
                init(): MetaReducer<AppState> {
                    return rootMetaReducerForExtension2;
                }
            }
            function rootMetaReducerForExtension3(reducer: Reducer<AppState>): Reducer<AppState> {
                return (state, action) => {
                    callOrder.push('meta3');
                    return reducer(state, action);
                };
            }
            class Extension3 extends StoreExtension {
                id = ExtensionId.LOGGER; // id does not matter, but it has to be implemented
                override sortOrder = 1;
                init(): MetaReducer<AppState> {
                    return rootMetaReducerForExtension3;
                }
            }
            setup({
                extensions: [new Extension(), new Extension2(), new Extension3()],
            });
            expect(callOrder).toEqual(['meta3', 'meta2', 'meta1']);
        });
        it(
            'should run reducers in order: ' +
                '1.) root meta reducers ' +
                '2.) root meta reducers from extensions' +
                '3.) feature meta reducers, ' +
                '4.) feature reducer',
            () => {
                const metaTestAction = createUniqueAction();
                function rootMetaReducerForExtension(
                    reducer: Reducer<AppState>
                ): Reducer<AppState> {
                    return (state, action) => {
                        if (action.type === metaTestAction.type) {
                            state = {
                                ...state,
                                metaTestFeature: state['metaTestFeature'] + 'x',
                            };
                        }
                        return reducer(state, action);
                    };
                }
                class Extension extends StoreExtension {
                    id = ExtensionId.LOGGER; // id does not matter, but it has to be implemented
                    init(): MetaReducer<AppState> {
                        return rootMetaReducerForExtension;
                    }
                }
                function aFeatureReducer(state = 'a', action: Action): string {
                    switch (action.type) {
                        case metaTestAction.type:
                            return state + 'e';
                        default:
                            return state;
                    }
                }
                function rootMetaReducer1(reducer: Reducer<AppState>): Reducer<AppState> {
                    return (state, action) => {
                        if (action.type === metaTestAction.type) {
                            state = {
                                ...state,
                                metaTestFeature: state['metaTestFeature'] + 'b',
                            };
                        }
                        return reducer(state, action);
                    };
                }
                function rootMetaReducer2(reducer: Reducer<AppState>): Reducer<AppState> {
                    return (state, action) => {
                        if (action.type === metaTestAction.type) {
                            state = {
                                ...state,
                                metaTestFeature: state['metaTestFeature'] + 'c',
                            };
                        }
                        return reducer(state, action);
                    };
                }
                function inTheMiddleRootMetaReducer(reducer: Reducer<AppState>): Reducer<AppState> {
                    return (state, action) => {
                        const nextState = reducer(state, action);
                        nextStateSpy(nextState);
                        return reducer(state, action);
                    };
                }
                function featureMetaReducer(reducer: Reducer<string>): Reducer<string> {
                    return (state, action) => {
                        if (action.type === metaTestAction.type) {
                            state = state + 'd';
                        }
                        return reducer(state, action);
                    };
                }
                const getMetaTestFeature = createFeatureStateSelector<string>('metaTestFeature');
                setup(
                    {
                        metaReducers: [
                            rootMetaReducer1,
                            inTheMiddleRootMetaReducer,
                            rootMetaReducer2,
                        ],
                        extensions: [new Extension()],
                    },
                    {
                        key: 'metaTestFeature',
                        reducer: aFeatureReducer,
                        config: {
                            metaReducers: [featureMetaReducer],
                        },
                    }
                );
                const selectedState = store.select(getMetaTestFeature);
                store.dispatch(metaTestAction);
                expect(selectedState()).toEqual('abcxde');
            }
        );
        it('should calculate nextState also if nextState is calculated by a metaReducer in the "middle"', () => {
            expect(nextStateSpy.mock.calls).toEqual([
                [{}],
                [{ metaTestFeature: 'a' }],
                [{ metaTestFeature: 'abcxde' }],
            ]);
        });
    });
});
describe('Store', () => {
    afterEach(() => {
        destroyStore();
    });
    it('should run the Redux reducers when a new feature is added', () => {
        const reducerSpy = jest.fn();
        function someReducer() {
            reducerSpy();
        }
        setup({}, { key: 'oneMoreFeature', reducer: someReducer });
        expect(reducerSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw when reusing feature name', () => {
        expect(() => {
            TestBed.configureTestingModule({
                imports: [
                    StoreModule.forRoot({}),
                    StoreModule.forFeature('alreadyExistingFeature', userReducer),
                ],
            });
            TestBed.configureTestingModule({
                imports: [StoreModule.forFeature('alreadyExistingFeature', userReducer)],
            });
            TestBed.inject(Store); // inject Store to execute TestBed
        }).toThrow('@mini-rx: Feature "alreadyExistingFeature" already exists.');
    });
    it('should dispatch an initial action when adding a feature', () => {
        const spy = jest.fn();
        actions.subscribe(spy);
        storeCore.addFeature('products', (state) => state);
        expect(spy).toHaveBeenCalledWith({ type: '@mini-rx/products/init' });
    });
    it('should update the Feature state', () => {
        setup({ reducers: { user: userReducer } });
        const user = {
            firstName: 'Nicolas',
            lastName: 'Cage',
        };
        store.dispatch({
            type: 'updateUser',
            payload: user,
        });
        const firstName = store.select(getFirstName);
        expect(firstName()).toEqual(user.firstName);
    });
    it('should update the Feature state', () => {
        setup({ reducers: { user: userReducer } });
        const age = store.select(getAge);
        expect(age()).toBe(30);
        store.dispatch({ type: 'incAge' });
        expect(age()).toBe(31);
    });
    it('should return undefined if feature does not exist yet', () => {
        const featureSelector = createFeatureStateSelector('notExistingFeature');
        const selectedState = store.select(featureSelector);
        expect(selectedState()).toBe(undefined);
    });
    it('should create and execute an effect #1', () => {
        const spy = jest.fn();
        actions.subscribe(spy);
        rxEffect(
            actions.pipe(
                ofType('fetchApi'),
                mergeMap(() =>
                    of('someUseResponse').pipe(
                        map((response) => ({
                            type: 'fetchApiSuccess',
                            payload: response,
                        }))
                    )
                )
            )
        );
        store.dispatch({ type: 'fetchApi' });
        expect(spy.mock.calls).toEqual([
            [{ type: 'fetchApi' }],
            [
                {
                    type: 'fetchApiSuccess',
                    payload: 'someUseResponse',
                },
            ],
        ]);
    });
    it('should create and execute an effect #2', () => {
        rxEffect(
            actions.pipe(
                ofType('loadUser'),
                mergeMap(() =>
                    fakeApiGet().pipe(
                        map((user) => ({
                            type: 'loadUserSuccess',
                            payload: user,
                        }))
                    )
                )
            )
        );
        cold('-a').subscribe(() => {
            store.dispatch({ type: 'loadUser' });
            // Let's be crazy and add another effect while the other effect is busy
            cold('-a').subscribe(() => {
                rxEffect(
                    actions.pipe(
                        ofType('saveUser'),
                        mergeMap(() =>
                            fakeApiUpdate().pipe(
                                map((user) => ({
                                    type: 'saveUserSuccess',
                                    payload: user,
                                }))
                            )
                        )
                    )
                );
                store.dispatch({ type: 'saveUser' });
            });
        });
        expect(actions).toBeObservable(
            hot('-ayzb', {
                a: { type: 'loadUser' },
                y: { type: 'saveUser' },
                z: { type: 'saveUserSuccess', payload: updatedAsyncUser },
                b: {
                    type: 'loadUserSuccess',
                    payload: asyncUser,
                },
            })
        );
    });
    it('should create and execute a non-dispatching effect', () => {
        const action1 = { type: 'someAction' };
        const action2 = { type: 'someAction2' };
        const effect = createRxEffect(
            actions.pipe(
                ofType(action1.type),
                mergeMap(() => of(action2))
            ),
            { dispatch: false }
        );
        rxEffect(effect);
        const spy = jest.fn();
        actions.subscribe(spy);
        store.dispatch(action1);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(action1);
        expect(spy).not.toHaveBeenCalledWith(action2);
    });
    it('should create and execute an effect and handle side effect error', () => {
        setup({ reducers: { user: userReducer } });
        rxEffect(
            actions.pipe(
                ofType('fetchApiWithError'),
                mergeMap(() =>
                    fakeApiWithError().pipe(
                        map(() => ({
                            type: 'whatever',
                        })),
                        catchError(() => of({ type: 'error', payload: 'error' }))
                    )
                )
            )
        );
        cold('-a').subscribe(() => {
            store.dispatch({ type: 'fetchApiWithError' });
        });
        expect(actions).toBeObservable(
            hot('-ab', { a: { type: 'fetchApiWithError' }, b: { type: 'error', payload: 'error' } })
        );
    });
    it('should call the reducer before running the effect', () => {
        const callOrder: string[] = [];
        const someAction = createUniqueAction();
        const someReducer = (state = { value: 0 }, action: Action) => {
            switch (action.type) {
                case someAction.type:
                    callOrder.push('reducer');
                    return {
                        ...state,
                        value: state.value + 1,
                    };
                default:
                    return state;
            }
        };
        setup({
            reducers: {
                someFeature: someReducer,
            },
        });
        const onEffectStarted = (): Observable<Action> => {
            callOrder.push('effect');
            return of({ type: 'whatever' });
        };
        const valueSpy = jest.fn();
        rxEffect(
            actions.pipe(
                ofType(someAction.type),
                mergeMap(() => {
                    const selectedState = store.select((state) => state['someFeature'].value);
                    valueSpy(selectedState());
                    return onEffectStarted();
                })
            )
        );
        store.dispatch(someAction);
        expect(callOrder).toEqual(['reducer', 'effect']);
        expect(valueSpy).toHaveBeenCalledWith(1); // Effect can select the updated state immediately
    });
    it('should queue actions', () => {
        const callLimit = 5000;
        const spy = jest.fn();
        setup({
            reducers: {
                counter: counterReducer,
            },
        });
        const selectedState = store.select((state) => state['counter'].counter);
        actions.pipe(take(callLimit), tap(spy), ofType('counter', 'counterStart')).subscribe(() => {
            store.dispatch({ type: 'counter' });
        });
        store.dispatch({ type: 'counterStart' });
        expect(spy).toHaveBeenCalledTimes(callLimit);
        expect(selectedState()).toBe(callLimit + 1); // +1 because initialState counter is 1
    });
    it('should queue effect actions', () => {
        const callLimit = 5000;
        const spy = jest.fn();
        rxEffect(
            actions.pipe(
                take(callLimit),
                tap(spy),
                ofType('counter', 'counterStart'),
                mergeMap(() => of({ type: 'counter' }))
            )
        );
        store.dispatch({ type: 'counterStart' });
        expect(spy).toHaveBeenCalledTimes(callLimit);
    });
    it('should select Feature Store via Store.select', () => {
        TestBed.runInInjectionContext(() => {
            const getCounterFeatureState = createFeatureStateSelector<CounterState>('counterFs');
            const getCounter = createSelector(getCounterFeatureState, (state) => state.counter);
            const counterFeatureState = new CounterFeatureStore();
            counterFeatureState.increment();
            const selectedState = store.select(getCounter);
            expect(selectedState()).toBe(2);
        });
    });
    it('should overwrite reducers default state with a provided initialState', () => {
        const featureKey = 'counter';
        const customInitialState: CounterState = {
            counter: 2,
        };
        setup(
            {},
            {
                key: featureKey,
                reducer: counterReducer,
                config: { initialState: customInitialState },
            }
        );
        const selectedState = store.select((state) => state[featureKey]);
        expect(selectedState()).toBe(customInitialState);
    });
    it('should resubscribe the effect 10 times (if side effect error is not handled)', () => {
        const spy = jest.fn();
        console.error = jest.fn();
        function apiCallWithError() {
            spy();
            throw new Error();
            return of('someValue');
        }
        rxEffect(
            actions.pipe(
                ofType('someAction'),
                mergeMap(() => apiCallWithError().pipe(map(() => ({ type: 'someActionSuccess' }))))
            )
        );
        store.dispatch({ type: 'someAction' });
        store.dispatch({ type: 'someAction' });
        store.dispatch({ type: 'someAction' });
        store.dispatch({ type: 'someAction' });
        store.dispatch({ type: 'someAction' });
        store.dispatch({ type: 'someAction' });
        store.dispatch({ type: 'someAction' });
        store.dispatch({ type: 'someAction' });
        store.dispatch({ type: 'someAction' });
        store.dispatch({ type: 'someAction' });
        store.dispatch({ type: 'someAction' });
        store.dispatch({ type: 'someAction' }); // #12 will not trigger the Api call anymore
        store.dispatch({ type: 'someAction' }); // #13 will not trigger the Api call anymore
        expect(spy).toHaveBeenCalledTimes(11); // Api call is performed 11 Times. First time + 10 re-subscriptions
        function getErrorMsg(times: number) {
            return `@mini-rx: An error occurred in the Effect. MiniRx resubscribed the Effect automatically and will do so ${times} more times.`;
        }
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0].forEach((times) => {
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining(getErrorMsg(times)),
                expect.any(Error)
            );
        });
        expect(console.error).toHaveBeenCalledTimes(10); // Re-subscription with error logging stopped after 10 times
    });
    it('should add and remove reducers', () => {
        const featureKey = 'tempCounter';
        storeCore.addFeature<CounterState>(featureKey, counterReducer);
        const selectedState = store.select((state) => state);
        expect(selectedState()).toEqual({ tempCounter: counterInitialState });
        storeCore.removeFeature(featureKey);
        expect(selectedState()).toEqual({});
    });
});
describe('StoreModule.forFeature MetaReducers', () => {
    const featureKey = 'someFeature';
    const getFeatureState = createFeatureStateSelector<CounterStringState>(featureKey);
    const getCount = createSelector(getFeatureState, (state) => state.count);
    const metaTestAction: Action = {
        type: 'someAction',
    };
    interface CounterStringState {
        count: string;
    }
    function aFeatureReducer(
        state: CounterStringState = { count: '0' },
        action: Action
    ): CounterStringState {
        switch (action.type) {
            case metaTestAction.type:
                return {
                    ...state,
                    count: state.count + '3',
                };
            default:
                return state;
        }
    }
    function featureMetaReducer1(reducer: Reducer<any>): Reducer<CounterStringState> {
        return (state, action: Action) => {
            if (action.type === metaTestAction.type) {
                state = {
                    ...state,
                    count: state.count + '1',
                };
            }
            return reducer(state, action);
        };
    }
    function featureMetaReducer2(reducer: Reducer<any>): Reducer<CounterStringState> {
        return (state, action: Action) => {
            if (action.type === metaTestAction.type) {
                state = {
                    ...state,
                    count: state.count + '2',
                };
            }
            return reducer(state, action);
        };
    }
    const nextStateSpy = jest.fn();
    function inTheMiddleMetaReducer(reducer: Reducer<any>): Reducer<any> {
        return (state, action) => {
            const nextState = reducer(state, action);
            nextStateSpy(nextState);
            return reducer(state, action);
        };
    }
    it('should run meta reducers first, then the normal reducer', () => {
        setup(
            {},
            {
                key: featureKey,
                reducer: aFeatureReducer,
                config: {
                    metaReducers: [
                        featureMetaReducer1,
                        inTheMiddleMetaReducer,
                        featureMetaReducer2,
                    ],
                },
            }
        );
        const selectedState = store.select(getCount);
        expect(selectedState()).toBe('0');
        store.dispatch(metaTestAction);
        expect(selectedState()).toBe('0123');
    });
    it('should calculate nextState also if nextState is calculated by a metaReducer in the "middle"', () => {
        expect(nextStateSpy.mock.calls).toEqual([[{ count: '0' }], [{ count: '0123' }]]);
    });
});
