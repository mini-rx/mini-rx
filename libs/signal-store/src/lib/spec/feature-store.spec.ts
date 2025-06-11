import { createFeatureStore, FeatureStore } from '../feature-store';
import { mergeMap, Observable, of, pipe, Subject, tap } from 'rxjs';
import { createFeatureStateSelector, createSelector } from '../signal-selector';
import { cold, hot } from 'jest-marbles';
import {
    counterInitialState,
    counterReducer,
    CounterState,
    destroyStore,
    userState,
    UserState,
} from './_spec-helpers';
import {
    Action,
    Actions,
    FeatureConfig,
    Reducer,
    StoreConfig,
    tapResponse,
    UndoExtension,
} from '@mini-rx/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '../modules/store.module';
import { Store } from '../store';
import {
    Component,
    effect,
    EnvironmentInjector,
    inject,
    Injectable,
    signal,
    Signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

let store: Store;
let actions: Actions;

function setupStore(
    config: StoreConfig<any> = {},
    feature?: { key: string; reducer: Reducer<any>; config?: Partial<FeatureConfig<any>> }
) {
    let moduleImports: any[] = [StoreModule.forRoot(config)];
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

@Component({
    template: undefined,
})
class MyComponent {}

function getComponentFixture(): ComponentFixture<MyComponent> {
    return TestBed.createComponent(MyComponent);
}

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
    private injector = inject(EnvironmentInjector);

    state$ = toObservable(this.select());
    firstName = this.select((state) => state.firstName);
    firstName$ = toObservable(this.firstName, { injector: this.injector });
    lastName = this.select((state) => state.lastName);
    country = this.select(getCountry);
    city = store?.select(getCity);
    someFeatureState = store?.select(getSomeFeatureSelector);

    loadFn = this.rxEffect((payload$) =>
        payload$.pipe(mergeMap(() => fakeApiGet().pipe(tap((user) => this.setState(user)))))
    );

    loadFnWithError = this.rxEffect((payload$) =>
        payload$.pipe(
            mergeMap(() =>
                fakeApiWithError().pipe(
                    tapResponse(
                        (user) => this.setState(user),
                        () => {
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
}

class CounterFeatureStore extends FeatureStore<CounterState> {
    counterState: Signal<number> = this.select((state) => state.counter);

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
    userFeatureStore = TestBed.runInInjectionContext(() => new UserFeatureStore());
}

let counterFeatureStore: CounterFeatureStore;
function setupCounterFeatureStore(): void {
    counterFeatureStore = TestBed.runInInjectionContext(() => new CounterFeatureStore());
}

describe('FeatureStore', () => {
    beforeEach(() => {
        destroyStore();
    });
    it('should initialize the feature', () => {
        setupUserFeatureStore();
        const selectedState = userFeatureStore.select();
        expect(selectedState()).toBe(initialState);
    });

    it('should expose the feature key', () => {
        setupUserFeatureStore();
        expect(userFeatureStore.featureKey).toBe('user');
    });

    it('should update state', () => {
        setupUserFeatureStore();
        userFeatureStore.updateFirstName('Nicolas');
        expect(userFeatureStore.firstName()).toBe('Nicolas');

        userFeatureStore.updateLastName('Cage');
        expect(userFeatureStore.lastName()).toBe('Cage');

        userFeatureStore.updateCountry('Belgium');
        expect(userFeatureStore.country()).toBe('Belgium');
    });

    it('should update state using callback', () => {
        setupCounterFeatureStore();

        expect(counterFeatureStore.counterState()).toBe(0);
        counterFeatureStore.increment();
        expect(counterFeatureStore.counterState()).toBe(1);
        counterFeatureStore.increment();
        expect(counterFeatureStore.counterState()).toBe(2);
    });

    it('should select state via Store.select', () => {
        setupStore();
        setupUserFeatureStore();
        expect(userFeatureStore.city()).toBe('LA');
    });

    it('should select state from the Feature Store', () => {
        setupUserFeatureStore();
        expect(userFeatureStore.country()).toBe('United States');
    });

    it('should select state from another Feature (created with Store.forFeature)', () => {
        setupStore({}, { key: 'someFeature', reducer: counterReducer });
        setupUserFeatureStore();
        expect(userFeatureStore.someFeatureState()).toBe(counterInitialState);
    });

    it('should create and execute an effect', () => {
        setupUserFeatureStore();

        const fixture = getComponentFixture();
        fixture.detectChanges();

        userFeatureStore.loadFn();

        cold('---a').subscribe(() => {
            fixture.detectChanges();
        });

        expect(userFeatureStore.firstName$).toBeObservable(
            hot('a--b', { a: 'Bruce', b: 'Steven' })
        );
    });

    it('should create and execute an effect and handle error', () => {
        setupUserFeatureStore();

        const fixture = getComponentFixture();
        fixture.detectChanges();

        userFeatureStore.loadFnWithError();

        cold('-a').subscribe(() => {
            fixture.detectChanges();
        });

        expect(userFeatureStore.state$).toBeObservable(
            hot('ab', { a: initialState, b: { ...initialState, err: 'error' } })
        );
    });

    it('should invoke effect via Observable or imperatively', () => {
        setupUserFeatureStore();

        const spy = jest.fn();

        function apiCall(param: number) {
            spy(param);
            return of('someValue');
        }

        const effect = userFeatureStore.rxEffect<number>(mergeMap((v) => apiCall(v)));
        effect(1);

        const source = new Subject<number>();
        const source2 = new Subject<number>();

        effect(source);

        source.next(2);
        source.next(3);
        effect(4);

        effect(source2);

        source2.next(11);
        source2.next(12);

        effect(5);

        expect(spy.mock.calls).toEqual([[1], [2], [3], [4], [11], [12], [5]]);
    });

    it('should invoke effect via Signal', () => {
        const effectCallback = jest.fn<void, [number]>();

        @Component({
            template: ``,
        })
        class WelcomeComponent {
            private fs = createFeatureStore('someFeature', counterInitialState);
            private myEffect = this.fs.rxEffect<number>(pipe(tap((v) => effectCallback(v))));
            private counterSignal = signal<number>(1);

            constructor() {
                // Trigger effect with the counterSource Subject
                this.myEffect(this.counterSignal);
            }

            updateObservableValue(v: number) {
                this.counterSignal.set(v);
            }
        }

        TestBed.configureTestingModule({
            declarations: [WelcomeComponent],
        }).compileComponents();

        const fixture = TestBed.createComponent(WelcomeComponent);
        const component = fixture.componentInstance;
        expect(component).toBeDefined();

        fixture.detectChanges();

        component.updateObservableValue(2);
        fixture.detectChanges();

        component.updateObservableValue(3);
        fixture.detectChanges();

        expect(effectCallback.mock.calls).toEqual([[1], [2], [3]]);
    });

    it('should resubscribe the effect 10 times (if side effect error is not handled)', () => {
        const spy = jest.fn();
        console.error = jest.fn();

        function apiCallWithError() {
            spy();
            throw new Error();
            return of('someValue');
        }

        const fs: FeatureStore<any> = TestBed.runInInjectionContext(() =>
            createFeatureStore('fsWithFailingApi', {})
        );

        const load = fs.rxEffect<void>(
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

        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0].forEach((times) => {
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining(getErrorMsg(times)),
                expect.any(Error)
            );
        });

        expect(console.error).toHaveBeenCalledTimes(10); // Re-subscription with error logging stopped after 10 times
    });

    it('should dispatch a set-state action', () => {
        setupUserFeatureStore();

        const spy = jest.fn();
        actions.subscribe(spy);
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

        setupStore({ metaReducers: [metaReducer] });
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

    it('should create a Feature Store with functional creation method', () => {
        const fs: FeatureStore<CounterState> = TestBed.runInInjectionContext(() =>
            createFeatureStore<CounterState>('funcFeatureStore', counterInitialState)
        );

        const getFeatureState = createFeatureStateSelector<CounterState>();
        const getCounter = createSelector(getFeatureState, (state) => state.counter);

        const counter: Signal<number> = fs.select(getCounter);

        function inc() {
            fs.setState((state) => ({
                counter: state.counter + 1,
            }));
        }

        expect(counter()).toBe(1);

        inc();

        expect(counter()).toBe(2);
    });

    it('should remove the feature state when Feature Store is destroyed', () => {
        const fs: FeatureStore<CounterState> = TestBed.runInInjectionContext(() =>
            createFeatureStore<CounterState>('tempFsState', counterInitialState)
        );

        const selectedState = store.select((state) => state);
        expect(selectedState()).toEqual(
            expect.objectContaining({ tempFsState: counterInitialState })
        );

        const actionSpy = jest.fn();
        actions.subscribe(actionSpy);

        fs['destroy']();
        expect(selectedState()).not.toHaveProperty('tempFsState');

        expect(actionSpy).toHaveBeenCalledWith({ type: '@mini-rx/tempFsState/destroy' });
    });

    it('should call FeatureStore.destroy when component is destroyed', () => {
        @Component({
            template: undefined,
        })
        class MyComponent {
            fs = createFeatureStore('tempFs', counterInitialState);
        }

        const fixture = TestBed.createComponent(MyComponent);
        const comp = fixture.componentInstance;

        const spy = jest.spyOn(comp.fs as any, 'destroy');
        fixture.componentRef.destroy();
        expect(spy).toHaveBeenCalled();
    });

    it('should allow many instances of the same Feature Store with config.multi', () => {
        const featureKey = 'multi-counter';

        class Fs extends FeatureStore<CounterState> {
            constructor() {
                super(featureKey, counterInitialState, { multi: true });
            }

            increment(): Action {
                return this.setState((state) => ({
                    counter: state.counter + 1,
                }));
            }
        }

        const fs1 = TestBed.runInInjectionContext(() => new Fs());
        const fs2 = TestBed.runInInjectionContext(() => new Fs());
        const fs3 = TestBed.runInInjectionContext(() =>
            createFeatureStore(featureKey, counterInitialState, { multi: true })
        );

        function incrementFs3(): void {
            fs3.setState((state) => ({ counter: state.counter + 1 }));
        }

        const fs1FeatureKey = fs1.featureKey;
        const getFs1Feature = createFeatureStateSelector<CounterState>(fs1FeatureKey);
        const getFs1Counter = createSelector(getFs1Feature, (state) => state?.counter);
        const fs1Counter = store.select(getFs1Counter);

        const fs2FeatureKey = fs2.featureKey;
        const getFs2Feature = createFeatureStateSelector<CounterState>(fs2FeatureKey);
        const getFs2Counter = createSelector(getFs2Feature, (state) => state.counter);
        const fs2Counter = store.select(getFs2Counter);

        const fs3FeatureKey = fs3.featureKey;
        const getFs3Feature = createFeatureStateSelector<CounterState>(fs3FeatureKey);
        const getFs3Counter = createSelector(getFs3Feature, (state) => state.counter);
        const fs3Counter = store.select(getFs3Counter);

        expect(fs1Counter()).toBe(1);
        fs1.increment();
        expect(fs1Counter()).toBe(2);
        fs1.increment();
        expect(fs1Counter()).toBe(3);

        expect(fs2Counter()).toBe(1);
        fs2.increment();
        expect(fs2Counter()).toBe(2);
        fs2.increment();
        expect(fs2Counter()).toBe(3);

        expect(fs3Counter()).toBe(1);
        incrementFs3();
        expect(fs3Counter()).toBe(2);
        incrementFs3();
        expect(fs3Counter()).toBe(3);

        fs1['destroy']();
        expect(fs1Counter()).toBe(undefined);

        expect(fs1.featureKey).toContain('multi-counter-');
        expect(fs2.featureKey).toContain('multi-counter-');
        expect(fs3.featureKey).toContain('multi-counter-');
    });

    it('should throw when using undo without extension', () => {
        setupStore();
        setupCounterFeatureStore();

        expect(() => counterFeatureStore.undo({ type: 'someType' })).toThrowError(
            '@mini-rx: UndoExtension is not initialized.'
        );
    });

    it('should undo state changes', () => {
        setupStore({ extensions: [new UndoExtension()] });
        setupCounterFeatureStore();

        const incremented = counterFeatureStore.setState((state) => ({
            counter: state.counter + 1,
        }));

        const selectedState = counterFeatureStore.select((state) => state.counter);

        expect(selectedState()).toBe(1);

        counterFeatureStore.undo(incremented);

        expect(selectedState()).toBe(0);
    });

    describe('imperative state read', () => {
        @Injectable({
            providedIn: 'root',
        })
        class MyService extends FeatureStore<{ count: number; name: string }> {
            effectRunCount = 0;

            get name(): string {
                return this.state.name;
            }

            constructor() {
                super('imperative-state-read', { count: 1, name: '' });

                effect(() => {
                    this.state.count; // Imperative state read
                    this.effectRunCount++;
                });
            }

            increment(): void {
                this.setState((state) => ({ count: state.count }));
            }

            updateName(name: string): void {
                this.setState({ name });
            }
        }

        let service: MyService;

        beforeEach(() => {
            TestBed.configureTestingModule({
                providers: [MyService],
            });
            service = TestBed.inject(MyService);
        });

        it('should return the current state snapshot', () => {
            service.updateName('Bruce');
            expect(service.name).toBe('Bruce');

            service.updateName('Nicolas');
            expect(service.name).toBe('Nicolas');
        });

        it('should be untracked (and not trigger `effect`)', () => {
            TestBed.flushEffects();
            expect(service.effectRunCount).toBe(1); // effect emits the initial value

            service.increment();
            TestBed.flushEffects();
            expect(service.effectRunCount).toBe(1); // increment should not trigger effect!
        });
    });
});
