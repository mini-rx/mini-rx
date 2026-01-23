import {
    addSignalSelectorKey,
    createFeatureStateSelector,
    createSelector,
} from '../signal-selector';
import { computed, Signal, signal, WritableSignal } from '@angular/core';
describe('Selectors', () => {
    describe('createSelector', () => {
        it('should deliver the value of selectors to the projection function', () => {
            const selector1 = createSelector(createFeatureStateSelector(), () => 1);
            const selector2 = createSelector(createFeatureStateSelector(), () => 2);
            const projectFn = jest.fn<void, [number, number]>();
            const selector = createSelector(selector1, selector2, projectFn);
            const selectedState = selector(signal({}));
            selectedState(); // Read Signal
            expect(projectFn.mock.calls).toEqual([[1, 2]]);
        });
        it('should call the projector function only when the value of a dependent selector change', () => {
            const state = signal({ someProp: 1, unchanged: 'state' });
            const neverChangingSelector = createFeatureStateSelector<string>('unchanged');
            const projectFn = jest.fn<void, [string]>();
            const selector = createSelector(neverChangingSelector, projectFn);
            const selectedState = selector(state);
            selectedState(); // Read Signal
            state.set({ someProp: 2, unchanged: 'state' }); // Change only someProp
            selectedState(); // Read Signal
            state.set({ someProp: 3, unchanged: 'state' }); // Change only someProp
            selectedState(); // Read Signal
            expect(projectFn).toHaveBeenCalledTimes(1);
        });
        it('should run computed callback only if dependent signal state changes', () => {
            const firstState = 1;
            const secondState = 2;
            const selector1Spy = jest.fn();
            const selector1 = (state: Signal<any>) => {
                return computed(() => {
                    selector1Spy();
                    return state();
                });
            };
            const selector2Spy = jest.fn();
            const selector2 = (state: Signal<any>) => {
                return computed(() => {
                    selector2Spy();
                    return state();
                });
            };
            const selector3Spy = jest.fn();
            const selector3 = (state: Signal<any>) => {
                return computed(() => {
                    selector3Spy();
                    return state();
                });
            };
            const projectFn = jest.fn();
            const signalState: WritableSignal<number> = signal(firstState);
            const selector = createSelector(
                // Use `addSignalSelectorKey` to make selector compatible with `createSelector`
                addSignalSelectorKey(selector1),
                addSignalSelectorKey(selector2),
                addSignalSelectorKey(selector3),
                projectFn
            );
            const selectedState = selector(signalState);
            signalState.set(firstState);
            selectedState(); // Read Signal
            signalState.set(firstState);
            selectedState(); // Read Signal
            signalState.set(firstState);
            selectedState(); // Read Signal
            signalState.set(secondState);
            selectedState(); // Read Signal
            signalState.set(secondState);
            selectedState(); // Read Signal
            expect(selector1Spy).toHaveBeenCalledTimes(2);
            expect(selector2Spy).toHaveBeenCalledTimes(2);
            expect(selector3Spy).toHaveBeenCalledTimes(2);
            expect(projectFn).toHaveBeenCalledTimes(2);
        });
        it('should memoize the error', () => {
            const signalState: WritableSignal<number> = signal(1);
            const selectorSpy = jest.fn();
            const projectSpy = jest.fn().mockImplementation((v) => v);
            const selector = (state: Signal<any>) => {
                return computed(() => {
                    selectorSpy();
                    if (state() % 2 === 0) {
                        // Throw only for even numbers
                        throw new Error();
                    }
                    return state();
                });
            };
            const createdSelector = createSelector(
                addSignalSelectorKey(selector), // Use `addSignalSelectorKey` to make selector compatible with `createSelector`
                projectSpy
            );
            const selectedState = createdSelector(signalState);
            signalState.set(1);
            expect(selectedState()).toBe(1);
            expect(selectorSpy).toHaveBeenCalledTimes(1);
            signalState.set(2);
            expect(() => selectedState()).toThrow();
            expect(selectorSpy).toHaveBeenCalledTimes(2);
            signalState.set(2); // Set the same state again
            expect(() => selectedState()).toThrow(); // but the same error is thrown
            expect(selectorSpy).toHaveBeenCalledTimes(2); // computed does not run again
            expect(projectSpy).toHaveBeenCalledTimes(1);
            // A new Signal value (which does not cause an error) will clear the memoized error
            signalState.set(3);
            expect(selectedState()).toBe(3);
            expect(selectorSpy).toHaveBeenCalledTimes(3);
            expect(projectSpy).toHaveBeenCalledTimes(2);
        });
    });
});
