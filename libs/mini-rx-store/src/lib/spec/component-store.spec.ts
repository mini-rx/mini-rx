import { ComponentStore, configureComponentStores, createComponentStore } from '../component-store';
import { counterInitialState, CounterState, userState } from './_spec-helpers';
import { pipe, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { createComponentStateSelector, createSelector } from '../selector';
import { ComponentStoreExtension, ExtensionId, StoreExtension } from '@mini-rx/common';
describe('ComponentStore', () => {
    it('should initialize the store', () => {
        const cs = createComponentStore(counterInitialState);
        const spy = jest.fn();
        cs.select().subscribe(spy);
        expect(spy).toHaveBeenCalledWith(counterInitialState);
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should update state', () => {
        const cs = createComponentStore(counterInitialState);
        const spy = jest.fn();
        cs.select().subscribe(spy);
        expect(spy).toHaveBeenCalledWith(counterInitialState);
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockReset();
        cs.setState((state) => ({ counter: state.counter + 1 }));
        expect(spy).toHaveBeenCalledWith({ counter: 2 });
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should update state partially', () => {
        const cs = createComponentStore(userState);
        const spy = jest.fn();
        cs.select().subscribe(spy);
        expect(spy).toHaveBeenCalledWith(userState);
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockReset();
        cs.setState(() => ({ firstName: 'Nicolas' }));
        expect(spy).toHaveBeenCalledWith({ ...userState, firstName: 'Nicolas' });
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should select state with key', () => {
        const spy = jest.fn();
        const cs = createComponentStore(userState);
        cs.select('firstName').subscribe(spy);
        expect(spy).toHaveBeenCalledWith('Bruce');
    });
    it('should select state with callback', () => {
        const spy = jest.fn();
        const cs = createComponentStore(userState);
        cs.select((state) => state.firstName).subscribe(spy);
        expect(spy).toHaveBeenCalledWith('Bruce');
    });
    it('should select state with memoized selectors', () => {
        const getCounterSpy = jest.fn<void, [number]>();
        const getSquareCounterSpy = jest.fn<void, [number]>();
        const cs = createComponentStore(counterInitialState);
        const getComponentState = createComponentStateSelector<CounterState>();
        const getCounter = createSelector(getComponentState, (state) => {
            getCounterSpy(state.counter);
            return state.counter;
        });
        const getSquareCounter = createSelector(getCounter, (counter) => {
            getSquareCounterSpy(counter);
            return counter * 2;
        });
        cs.select(getSquareCounter).subscribe();
        cs.setState({ counter: 2 });
        cs.setState({ counter: 2 });
        cs.setState({ counter: 3 });
        cs.setState({ counter: 3 });
        cs.setState({ counter: 4 });
        expect(getCounterSpy.mock.calls).toEqual([[1], [2], [2], [3], [3], [4]]); // No memoization: because a new state object is created for every call of `setState`
        expect(getSquareCounterSpy.mock.calls).toEqual([[1], [2], [3], [4]]);
    });
    it('should dispatch an Action when updating state', () => {
        const cs = createComponentStore(counterInitialState);
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
    });
    it('should dispatch an Action on destroy (only if initial state has been set)', () => {
        // Without initial state
        const cs = createComponentStore();
        const spy = jest.fn();
        cs['actionsOnQueue'].actions$.subscribe(spy);
        cs.destroy();
        expect(spy).toHaveBeenCalledTimes(0);
        // With initial state
        const cs2 = createComponentStore(counterInitialState);
        const spy2 = jest.fn();
        cs2['actionsOnQueue'].actions$.subscribe(spy2);
        cs2.destroy();
        expect(spy2.mock.calls).toEqual([
            [
                {
                    type: '@mini-rx/component-store/destroy',
                },
            ],
        ]);
    });
    it('should unsubscribe an effect on destroy', () => {
        const effectCallback = jest.fn<void, [number]>();
        const cs = createComponentStore(counterInitialState);
        const myEffect = cs.effect<number>(pipe(tap((v) => effectCallback(v))));
        const counterSource = new Subject<number>();
        // Trigger effect with the counterSource Subject
        myEffect(counterSource);
        counterSource.next(1);
        counterSource.next(2);
        // Trigger effect imperatively (just to cover both ways to trigger an effect)
        myEffect(3);
        myEffect(4);
        cs.destroy();
        counterSource.next(5);
        myEffect(6);
        expect(effectCallback.mock.calls).toEqual([[1], [2], [3], [4]]);
    });
    it('should initialize the store lazily', () => {
        const cs = createComponentStore();
        const spy = jest.fn();
        cs.select().subscribe(spy);
        expect(spy).toHaveBeenCalledTimes(0);
        cs.setInitialState(counterInitialState);
        expect(spy).toHaveBeenCalledWith(counterInitialState);
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should update state of the lazily initialized store', () => {
        const cs = createComponentStore<CounterState>();
        const spy = jest.fn();
        cs.select().subscribe(spy);
        expect(spy).toHaveBeenCalledTimes(0);
        spy.mockReset();
        cs.setInitialState(counterInitialState);
        expect(spy).toHaveBeenCalledWith(counterInitialState);
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockReset();
        cs.setState((state) => ({ counter: state.counter + 1 }));
        expect(spy).toHaveBeenCalledWith({ counter: 2 });
        expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should throw when accessing not initialized state', () => {
        const cs = createComponentStore();
        expect(() => cs.state).toThrow(
            '@mini-rx: ComponentStore has no initialState yet. Please provide an initialState before updating/getting state.'
        );
    });
    it('should throw when updating state and no initial state was provided', () => {
        const cs = createComponentStore();
        expect(() => cs.setState((state) => state)).toThrow(
            '@mini-rx: ComponentStore has no initialState yet. Please provide an initialState before updating/getting state.'
        );
    });
    it('should throw when calling setInitialState, but initial state was provided already', () => {
        const cs = createComponentStore(counterInitialState);
        expect(() => cs.setInitialState(counterInitialState)).toThrow(
            '@mini-rx: ComponentStore has initialState already.'
        );
        const cs2 = createComponentStore();
        cs2.setInitialState(counterInitialState);
        expect(() => cs.setInitialState(counterInitialState)).toThrow(
            '@mini-rx: ComponentStore has initialState already.'
        );
    });
    it('should throw when calling `configureComponentStores` more than once', () => {
        configureComponentStores({ extensions: [] });
        expect(() => configureComponentStores({ extensions: [] })).toThrow(
            '@mini-rx: ComponentStore config was set multiple times.'
        );
    });
    it('should throw when using undo without extension', () => {
        const cs = createComponentStore();
        expect(() => cs.undo({ type: 'someType' })).toThrow(
            '@mini-rx: ComponentStore has no UndoExtension yet.'
        );
    });
    it('should throw when a not supported extension is used', () => {
        class MyExtension extends StoreExtension {
            id: ExtensionId = ExtensionId.LOGGER;
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            init(): void {}
        }
        expect(() =>
            createComponentStore(undefined, {
                extensions: [new MyExtension() as ComponentStoreExtension],
            })
        ).toThrow('@mini-rx: Extension "MyExtension" is not supported by Component Store.');
    });
    it('should queue actions', () => {
        const counter1Spy = jest.fn<void, [number]>();
        const counter2Spy = jest.fn<void, [number]>();
        class CounterStore extends ComponentStore<{
            counter1: number;
            counter2: number;
        }> {
            counter1$ = this.select((state) => state.counter1);
            counter2$ = this.select((state) => state.counter2);
            constructor() {
                super({ counter1: 1, counter2: 10 });
            }
            updateCounter1(v: number): void {
                this.setState({ counter1: v });
            }
            updateCounter2(v: number): void {
                this.setState({ counter2: v });
            }
        }
        // Situation: A state change is triggering another state change
        const store = new CounterStore();
        store.counter1$.subscribe((v) => {
            counter1Spy(v);
            store.updateCounter2(v);
        });
        store.counter2$.subscribe(counter2Spy);
        // expect(counter1Spy.calls.allArgs()).toEqual([[1]]);
        expect(counter1Spy.mock.calls).toEqual([[1]]);
        expect(counter2Spy.mock.calls).toEqual([[1]]);
        store.updateCounter1(2);
        expect(counter1Spy.mock.calls).toEqual([[1], [2]]);
        expect(counter1Spy.mock.calls).toEqual([[1], [2]]); // Without queuing the actions we would see here: [[1], [2], [1]]
    });
});
