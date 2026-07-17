import { createFeatureStore, FeatureStore } from '../feature-store';
import { mergeMap, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { createFeatureStateSelector, createSelector } from '../selector';
import { cold, hot } from 'jest-marbles';
import {
    counterInitialState,
    counterReducer,
    CounterState,
    destroyStore,
    store,
    userState,
    UserState,
} from './_spec-helpers';
import { Action, Reducer, tapResponse } from '@mini-rx/common';
import { actions$, storeCore } from '../store-core';
const initialState: UserState = userState;
const asyncUser: UserState = {
    firstName: 'Steven',
    lastName: 'Seagal',
    city: 'LA',
    country: 'United States',
    err: '',
};
function fakeApiGet(): Observable<UserState> {
    return cold('---a', { a: asyncUser });
}
function fakeApiWithError(): Observable<UserState> {
    return cold('-#');
}
const getUserFeatureState = createFeatureStateSelector<UserState>('user'); // Select From App State
const getCity = createSelector(getUserFeatureState, (state) => state.city);
const getUserFeatureState2 = createFeatureStateSelector<UserState>(); // Select directly from Feature State by omitting the Feature name
const getCountry = createSelector(getUserFeatureState2, (state) => state.country);
const getSomeFeatureSelector = createFeatureStateSelector<CounterState>('someFeature');
class UserFeatureStore extends FeatureStore<UserState> {
    firstName$ = this.select('firstName'); // Select state by key
    lastName$ = this.select((state) => state.lastName); // Select state with selector fn
    country$ = this.select(getCountry); // Select state with memoized selector fn
    city$ = store.select(getCity); // Select state with memoized selector fn
    someFeatureState$ = store.select(getSomeFeatureSelector);
    loadFn = this.effect((payload$) =>
        payload$.pipe(mergeMap(() => fakeApiGet().pipe(tap((user) => this.setState(user)))))
    );
    loadFnWithError = this.effect((payload$) =>
        payload$.pipe(
            mergeMap(() =>
                fakeApiWithError().pipe(
                    tapResponse(
                        (user) => this.setState(user),
                        (err) => {
                            this.setState({ err: 'error' });
                        }
                    )
                )
            )
        )
    );
    constructor() {
        super('user', initialState);
    }
    updateFirstName(firstName: string) {
        this.setState({ firstName });
    }
    updateLastName(lastName: string) {
        this.setState({ lastName });
    }
    updateCity(city: string) {
        this.setState({ city }, 'updateCity');
    }
    updateCountry(country: string) {
        this.setState({
            ...this.state, // Test updating state using `this.state`
            country,
        });
    }
    resetState() {
        this.setState(initialState);
    }
}
class CounterFeature extends FeatureStore<CounterState> {
    counter$: Observable<number> = this.select((state) => state.counter);
    constructor() {
        super('counter', { counter: 0 });
    }
    increment() {
        // Update state using callback
        this.setState((state) => ({ counter: state.counter + 1 }));
    }
}
let userFeatureStore: UserFeatureStore;
function setupUserFeatureStore() {
    userFeatureStore = new UserFeatureStore();
}
let counterFeatureStore: CounterFeature;
function setupCounterFeatureStore(): void {
    counterFeatureStore = new CounterFeature();
}
describe('FeatureStore', () => {
    beforeEach(() => {
        destroyStore();
    });
    it('should initialize the feature', () => {
        setupUserFeatureStore();
        const spy = jest.fn();
        userFeatureStore.select().subscribe(spy);
        expect(spy).toHaveBeenCalledWith(initialState);
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should expose the feature key', () => {
        setupUserFeatureStore();
        expect(userFeatureStore.featureKey).toBe('user');
    });
    it('should update state', () => {
        setupUserFeatureStore();
        userFeatureStore.updateFirstName('Nicolas');
        const spy = jest.fn();
        userFeatureStore.firstName$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith('Nicolas');
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockReset();
        userFeatureStore.updateLastName('Cage');
        userFeatureStore.lastName$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith('Cage');
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockReset();
        userFeatureStore.updateCountry('Belgium'); // Test updating state using `this.state`
        userFeatureStore.country$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith('Belgium');
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should update state using callback', () => {
        setupCounterFeatureStore();
        const spy = jest.fn();
        counterFeatureStore.counter$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith(0);
        expect(spy).toHaveBeenCalledTimes(1);
        counterFeatureStore.increment();
        expect(spy).toHaveBeenCalledWith(1);
        expect(spy).toHaveBeenCalledTimes(2);
    });
    it('should select state from App State', () => {
        setupUserFeatureStore();
        const spy = jest.fn();
        userFeatureStore.city$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith('LA');
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should select state from Feature State', () => {
        setupUserFeatureStore();
        const spy = jest.fn();
        userFeatureStore.country$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith('United States');
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should select state from another Feature (created with Store.feature)', () => {
        storeCore.configureStore({
            reducers: {
                someFeature: counterReducer,
            },
        });
        setupUserFeatureStore();
        const spy = jest.fn();
        userFeatureStore.someFeatureState$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith(counterInitialState);
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should create and execute an effect', () => {
        setupUserFeatureStore();
        userFeatureStore.loadFn();
        expect(userFeatureStore.firstName$).toBeObservable(
            hot('a--b', { a: 'Bruce', b: 'Steven' })
        );
    });
    it('should invoke effect via Observable or imperatively', () => {
        setupUserFeatureStore();
        const spy = jest.fn();
        function apiCall(param: number) {
            spy(param);
            return of('someValue');
        }
        const effect = userFeatureStore.effect<number>(mergeMap((v) => apiCall(v)));
        effect(1);
        const source = new Subject<number>();
        const source2 = new Subject<number>();
        effect(source);
        source.next(2);
        source.next(3);
        effect(4);
        effect(source2);
        source2.next(11);
        source.complete();
        source2.next(12);
        effect(5);
        expect(spy.mock.calls).toEqual([[1], [2], [3], [4], [11], [12], [5]]);
    });
    it('should create and execute an effect and handle error', () => {
        setupUserFeatureStore();
        userFeatureStore.resetState();
        userFeatureStore.loadFnWithError();
        expect(userFeatureStore.select()).toBeObservable(
            hot('ab', { a: initialState, b: { ...initialState, err: 'error' } })
        );
    });
    it('should resubscribe the effect 10 times (if side effect error is not handled)', () => {
        const spy = jest.fn();
        console.error = jest.fn();
        function apiCallWithError() {
            spy();
            throw new Error();
            return of('someValue');
        }
        const fs: FeatureStore<any> = createFeatureStore('fsWithFailingApi', {});
        const load = fs.effect<void>(
            mergeMap(() => apiCallWithError().pipe(tap(() => fs.setState({}))))
        );
        load();
        load();
        load();
        load();
        load();
        load();
        load();
        load();
        load();
        load();
        load();
        load(); // #12 will not trigger the Api call anymore
        load(); // #13 will not trigger the Api call anymore
        expect(spy).toHaveBeenCalledTimes(11); // Api call is performed 11 Times. First time + 10 re-subscriptions
        function getErrorMsg(times: number) {
            return `@mini-rx: An error occurred in the Effect. MiniRx resubscribed the Effect automatically and will do so ${times} more times.`;
        }
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(9)),
            expect.any(Error)
        );
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(8)),
            expect.any(Error)
        );
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(7)),
            expect.any(Error)
        );
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(6)),
            expect.any(Error)
        );
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(5)),
            expect.any(Error)
        );
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(4)),
            expect.any(Error)
        );
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(3)),
            expect.any(Error)
        );
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(2)),
            expect.any(Error)
        );
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(1)),
            expect.any(Error)
        );
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(0)),
            expect.any(Error)
        );
        expect(console.error).toHaveBeenCalledTimes(10); // Re-subscription with error logging stopped after 10 times
    });
    it('should dispatch a set-state action', () => {
        setupUserFeatureStore();
        const spy = jest.fn();
        actions$.subscribe(spy);
        userFeatureStore.updateCity('NY');
        expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: '@mini-rx/user/set-state/updateCity',
                stateOrCallback: { city: 'NY' },
                featureId: expect.any(String),
            })
        );
    });
    it('should run the meta reducers when state changes', () => {
        const metaReducerSpy = jest.fn();
        function metaReducer(reducer: Reducer<any>): Reducer<any> {
            return (state, action: Action) => {
                metaReducerSpy(action);
                return reducer(state, action);
            };
        }
        storeCore.configureStore({
            metaReducers: [metaReducer],
        });
        setupUserFeatureStore();
        setupCounterFeatureStore();
        userFeatureStore.updateCity('NY');
        counterFeatureStore.increment();
        expect(metaReducerSpy.mock.calls).toEqual([
            [{ type: '@mini-rx/init' }],
            [
                {
                    type: '@mini-rx/user/init',
                },
            ],
            [
                {
                    type: '@mini-rx/counter/init',
                },
            ],
            [expect.objectContaining({ type: '@mini-rx/user/set-state/updateCity' })],
            [expect.objectContaining({ type: '@mini-rx/counter/set-state' })],
        ]);
    });
    it('should create a Feature Store with functional creation methods', () => {
        const fs: FeatureStore<CounterState> = createFeatureStore<CounterState>(
            'funcFeatureStore',
            counterInitialState
        );
        const getFeatureState = createFeatureStateSelector<CounterState>();
        const getCounter = createSelector(getFeatureState, (state) => state.counter);
        const counter$: Observable<number> = fs.select(getCounter);
        function inc() {
            fs.setState((state) => ({
                counter: state.counter + 1,
            }));
        }
        const spy = jest.fn();
        counter$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith(1);
        inc();
        expect(spy).toHaveBeenCalledWith(2);
    });
    it('should remove the feature state when Feature Store is destroyed', () => {
        const fs: FeatureStore<CounterState> = createFeatureStore<CounterState>(
            'tempFsState',
            counterInitialState
        );
        const spy = jest.fn();
        store.select((state) => state).subscribe(spy);
        expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({ tempFsState: counterInitialState })
        );
        const actionSpy = jest.fn();
        actions$.subscribe(actionSpy);
        fs.destroy();
        expect(spy).toHaveBeenCalledWith(
            expect.not.objectContaining({ tempCounter: counterInitialState })
        );
        expect(actionSpy).toHaveBeenCalledWith({ type: '@mini-rx/tempFsState/destroy' });
    });
    it('should call FeatureStore.destroy when Angular ngOnDestroy is called', () => {
        const fs: FeatureStore<CounterState> = createFeatureStore<CounterState>(
            'tempFsState',
            counterInitialState
        );
        const spy = jest.spyOn(fs, 'destroy');
        fs.ngOnDestroy();
        expect(spy).toHaveBeenCalled();
    });
    it('should allow many instances of the same feature store with config.multi', () => {
        const featureKey = 'multi-counter';
        class Fs extends FeatureStore<CounterState> {
            constructor() {
                super(featureKey, counterInitialState, { multi: true });
            }
            increment(): Action {
                return this.setState({
                    counter: this.state.counter + 1,
                });
            }
        }
        const fs1 = new Fs();
        const fs2 = new Fs();
        const fs3 = createFeatureStore(featureKey, counterInitialState, { multi: true }); // Functional creation method should also support multi: true
        function incrementFs4(): void {
            fs3.setState((state) => ({ counter: state.counter + 1 }));
        }
        const spy = jest.fn();
        const spy2 = jest.fn();
        const spy3 = jest.fn();
        const fs2FeatureKey = fs1.featureKey;
        const getFs2Feature = createFeatureStateSelector<CounterState>(fs2FeatureKey);
        const getFs2Counter = createSelector(getFs2Feature, (state) => state?.counter);
        const fs3FeatureKey = fs2.featureKey;
        const getFs3Feature = createFeatureStateSelector<CounterState>(fs3FeatureKey);
        const getFs3Counter = createSelector(getFs3Feature, (state) => state?.counter);
        const fs4FeatureKey = fs3.featureKey;
        const getFs4Feature = createFeatureStateSelector<CounterState>(fs4FeatureKey);
        const getFs4Counter = createSelector(getFs4Feature, (state) => state?.counter);
        store.select(getFs2Counter).subscribe(spy);
        store.select(getFs3Counter).subscribe(spy2);
        store.select(getFs4Counter).subscribe(spy3);
        fs1.increment();
        fs2.increment();
        fs2.increment();
        incrementFs4();
        incrementFs4();
        incrementFs4();
        fs2.destroy();
        expect(spy.mock.calls).toEqual([[1], [2]]);
        expect(spy2.mock.calls).toEqual([[1], [2], [3], [undefined]]);
        expect(spy3.mock.calls).toEqual([[1], [2], [3], [4]]);
        expect(fs2FeatureKey).toContain('multi-counter-');
        expect(fs3FeatureKey).toContain('multi-counter-');
    });
    it('should connect state with an Observable', () => {
        setupCounterFeatureStore();
        const spy = jest.fn();
        counterFeatureStore.counter$.subscribe(spy);
        expect(spy).toHaveBeenCalledWith(0);
        const counterSource = new BehaviorSubject(1);
        // connect with Observable
        counterFeatureStore.connect({ counter: counterSource });
        expect(spy).toHaveBeenCalledWith(1);
        counterSource.next(2);
        expect(spy).toHaveBeenCalledWith(2);
    });
});
