import { ComponentStore, createComponentStore } from '../component-store';
import { counterInitialState, CounterState, MockUndoExtension, userState } from './_spec-helpers';
import { Observable, of, pipe, Subject, tap } from 'rxjs';
import { createComponentStateSelector, createSelector } from '../signal-selector';
import { ComponentStoreConfig, UndoExtension } from '@mini-rx/common';
import { TestBed } from '@angular/core/testing';
import { Component, effect, Injectable, signal } from '@angular/core';

function setup<T extends object>(
    initialState: T,
    config?: ComponentStoreConfig
): ComponentStore<T> {
    return TestBed.runInInjectionContext(() => {
        return createComponentStore(initialState, config);
    });
}

describe('ComponentStore', () => {
    it('should initialize the store', () => {
        const cs = setup(counterInitialState);

        const selectedState = cs.select();
        expect(selectedState()).toBe(counterInitialState);
    });

    it('should update state', () => {
        const cs = setup(counterInitialState);

        const selectedState = cs.select();
        expect(selectedState()).toBe(counterInitialState);

        cs.setState((state) => ({ counter: state.counter + 1 }));
        expect(selectedState()).toEqual({ counter: 2 });
    });

    it('should update state partially', () => {
        const cs = setup(userState);

        const selectedState = cs.select();
        expect(selectedState()).toBe(userState);

        cs.setState(() => ({ firstName: 'Nicolas' }));
        expect(selectedState()).toEqual({ ...userState, firstName: 'Nicolas' });
    });

    it('should connect state with an Observable', () => {
        const cs = setup(counterInitialState);

        const counterState$: Observable<number> = of(2, 3, 4, 5);

        const selectedState = cs.select((state) => state.counter);

        expect(selectedState()).toBe(1);

        // connect with Observable
        cs.connect({ counter: counterState$ });

        expect(selectedState()).toBe(5);

        cs.setState((state) => ({ counter: state.counter + 1 }));
        expect(selectedState()).toBe(6);

        cs.setState((state) => ({ counter: state.counter + 1 }));
        expect(selectedState()).toBe(7);
    });

    it('should connect state with a Signal', () => {
        @Component({
            template: `
                <span>{{ selectedCounterState() }}</span>
            `,
        })
        class MyComponent {
            counterSignal = signal(2);

            private cs = createComponentStore(counterInitialState);
            selectedCounterState = this.cs.select((state) => state.counter);

            startUpdatingStateWithSignal() {
                this.cs.connect({ counter: this.counterSignal });
            }
        }

        TestBed.configureTestingModule({
            declarations: [MyComponent],
        }).compileComponents();

        const fixture = TestBed.createComponent(MyComponent);
        const component = fixture.componentInstance;
        expect(component).toBeDefined();

        fixture.detectChanges();
        expect(component.selectedCounterState()).toBe(1); // From store initial state

        component.startUpdatingStateWithSignal();
        fixture.detectChanges();
        expect(component.selectedCounterState()).toBe(2); // From signal initial state

        component.counterSignal.set(3);
        fixture.detectChanges();
        expect(component.selectedCounterState()).toBe(3); // From signal.set
    });

    it('should select state with memoized selectors', () => {
        const getCounterSpy = jest.fn<void, [number]>();
        const getSquareCounterSpy = jest.fn<void, [number]>();

        const cs = setup(counterInitialState);

        const getComponentState = createComponentStateSelector<CounterState>();
        const getCounter = createSelector(getComponentState, (state) => {
            getCounterSpy(state.counter);
            return state.counter;
        });
        const getSquareCounter = createSelector(getCounter, (counter) => {
            getSquareCounterSpy(counter);
            return counter * 2;
        });

        const selectedState = cs.select(getSquareCounter);
        selectedState();
        cs.setState({ counter: 2 });
        selectedState();
        cs.setState({ counter: 2 });
        selectedState();
        cs.setState({ counter: 3 });
        selectedState();
        cs.setState({ counter: 3 });
        selectedState();
        cs.setState({ counter: 4 });
        selectedState();

        expect(getCounterSpy.mock.calls).toEqual([[1], [2], [2], [3], [3], [4]]); // No memoization: because a new state object is created for every call of `setState`
        expect(getSquareCounterSpy.mock.calls).toEqual([[1], [2], [3], [4]]);
    });

    it('should dispatch an Action when updating state', () => {
        const cs = setup(counterInitialState);

        const spy = jest.fn();
        cs['actionsOnQueue'].actions$.subscribe(spy);

        const setStateCallback = (state: CounterState) => ({ counter: state.counter + 1 });
        cs.setState(setStateCallback);
        expect(spy).toHaveBeenCalledWith({
            type: '@mini-rx/component-store/set-state',
            stateOrCallback: setStateCallback,
        });
        expect(spy).toHaveBeenCalledTimes(1);

        spy.mockReset();

        // With setState name
        cs.setState(setStateCallback, 'increment');
        expect(spy).toHaveBeenCalledWith({
            type: '@mini-rx/component-store/set-state/increment',
            stateOrCallback: setStateCallback,
        });
        expect(spy).toHaveBeenCalledTimes(1);

        spy.mockReset();

        // With connection name (when passing an Observable to connect)
        cs.connect({
            counter: of(1, 2),
        });
        expect(spy.mock.calls).toEqual([
            [
                {
                    type: '@mini-rx/component-store/connection/counter',
                    stateOrCallback: {
                        counter: 1,
                    },
                },
            ],
            [
                {
                    type: '@mini-rx/component-store/connection/counter',
                    stateOrCallback: {
                        counter: 2,
                    },
                },
            ],
        ]);
    });

    it('should dispatch an Action on destroy', () => {
        @Component({
            template: undefined,
        })
        class MyComponent {
            cs = createComponentStore({});
        }

        TestBed.configureTestingModule({
            declarations: [MyComponent],
        }).compileComponents();

        const fixture = TestBed.createComponent(MyComponent);
        const component = fixture.componentInstance;
        expect(component).toBeDefined();

        const spy = jest.fn();
        component.cs['actionsOnQueue'].actions$.subscribe(spy);

        fixture.componentRef.destroy();

        expect(spy.mock.calls).toEqual([
            [
                {
                    type: '@mini-rx/component-store/destroy',
                },
            ],
        ]);
    });

    it('should unsubscribe from connected Observable on destroy', () => {
        const spy = jest.fn();

        @Component({
            template: undefined,
        })
        class MyComponent {
            private cs = createComponentStore(counterInitialState);
            private counterSource = new Subject<number>();
            selectedState = this.cs.select((state) => state.counter);

            useObservableToUpdateState() {
                this.cs.connect({ counter: this.counterSource.pipe(tap((v) => spy(v))) });
            }

            updateObservableValue(v: number) {
                this.counterSource.next(v);
            }
        }

        TestBed.configureTestingModule({
            declarations: [MyComponent],
        }).compileComponents();

        const fixture = TestBed.createComponent(MyComponent);
        const component: MyComponent = fixture.componentInstance;
        expect(component).toBeDefined();

        component.useObservableToUpdateState();
        expect(component.selectedState()).toBe(1);

        component.updateObservableValue(1);
        expect(component.selectedState()).toBe(1);
        component.updateObservableValue(2);
        expect(component.selectedState());

        fixture.componentRef.destroy();

        component.updateObservableValue(3);
        expect(component.selectedState()).toBe(2);
    });

    it('should unsubscribe an effect on destroy', () => {
        const effectCallback = jest.fn<void, [number]>();

        @Component({
            template: ``,
        })
        class MyComponent {
            private cs = createComponentStore(counterInitialState);
            private myEffect = this.cs.rxEffect<number>(pipe(tap((v) => effectCallback(v))));
            private counterSource = new Subject<number>();

            constructor() {
                // Trigger effect with the counterSource Subject
                this.myEffect(this.counterSource);
            }

            updateObservableValue(v: number) {
                this.counterSource.next(v);
            }
        }

        TestBed.configureTestingModule({
            declarations: [MyComponent],
        }).compileComponents();

        const fixture = TestBed.createComponent(MyComponent);
        const component: MyComponent = fixture.componentInstance;
        expect(component).toBeDefined();

        component.updateObservableValue(1);
        component.updateObservableValue(2);

        fixture.componentRef.destroy();

        component.updateObservableValue(3);

        expect(effectCallback.mock.calls).toEqual([[1], [2]]);
    });

    it('should throw when using undo without extension', () => {
        const cs = setup({});

        expect(() => cs.undo({ type: 'someType' })).toThrowError(
            '@mini-rx: ComponentStore has no UndoExtension yet.'
        );
    });

    it('should dispatch an undo action with the Undo Extension', () => {
        const cs = setup({}, { extensions: [new MockUndoExtension()] });

        const action = cs.setState({});

        const spy = jest.fn();
        cs['actionsOnQueue'].actions$.subscribe(spy);

        cs.undo(action);

        expect(spy).toHaveBeenCalledWith({
            type: '@mini-rx/undo',
            payload: action,
        });
    });

    it('should undo state changes', () => {
        const cs = setup({ counter: 1 }, { extensions: [new UndoExtension()] });

        const incremented = cs.setState((state) => ({ counter: state.counter + 1 }));

        const selectedState = cs.select((state) => state.counter);

        expect(selectedState()).toBe(2);

        cs.undo(incremented);

        expect(selectedState()).toBe(1);
    });

    describe('imperative state read', () => {
        @Injectable({
            providedIn: 'root',
        })
        class MyService extends ComponentStore<{ count: number; name: string }> {
            effectRunCount = 0;

            get name(): string {
                return this.state.name;
            }

            constructor() {
                super({ count: 1, name: '' });

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
