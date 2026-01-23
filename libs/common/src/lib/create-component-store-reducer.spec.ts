import { createComponentStoreReducer } from './create-component-store-reducer';
import { createMiniRxActionType } from './create-mini-rx-action-type';
import { Action, MiniRxAction, OperationType } from './models';
interface CounterState {
    counter: number;
}
describe('createComponentStoreReducer', () => {
    const reducer = createComponentStoreReducer<CounterState>({ counter: 1 }, []);
    it('should update state', () => {
        const action: MiniRxAction<CounterState> = {
            type: createMiniRxActionType(OperationType.SET_STATE),
            stateOrCallback: (state) => ({ ...state, counter: state.counter + 1 }),
        };
        const nextState = reducer({ counter: 1 }, action);
        expect(nextState).toEqual({ counter: 2 });
    });
    it('should NOT update state', () => {
        const notComponentStoreAction: Action = { type: 'abc' };
        const state = { counter: 1 };
        const nextState = reducer(state, notComponentStoreAction);
        expect(nextState).toBe(state);
    });
});
