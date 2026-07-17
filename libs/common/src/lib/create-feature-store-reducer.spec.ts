import { createFeatureStoreReducer } from './create-feature-store-reducer';
import { createMiniRxActionType } from './create-mini-rx-action-type';
import { Action, MiniRxAction, OperationType } from './models';
interface CounterState {
    counter: number;
}
describe('createFeatureStoreReducer', () => {
    const featureId = '123';
    const reducer = createFeatureStoreReducer<CounterState>(featureId, { counter: 1 });
    it('should update state', () => {
        const action: MiniRxAction<CounterState> = {
            type: createMiniRxActionType(OperationType.SET_STATE),
            stateOrCallback: (state) => ({ ...state, counter: state.counter + 1 }),
            featureId,
        };
        const nextState = reducer({ counter: 1 }, action);
        expect(nextState).toEqual({ counter: 2 });
    });
    it('should NOT update state', () => {
        const notFeatureStoreAction: Action = { type: 'abc' };
        const state = { counter: 1 };
        let nextState = reducer(state, notFeatureStoreAction);
        expect(nextState).toBe(state);
        const actionWithWrongFeatureId: MiniRxAction<CounterState> = {
            type: createMiniRxActionType(OperationType.SET_STATE),
            stateOrCallback: (state) => ({ ...state, counter: state.counter + 1 }),
            featureId: 'abc',
        };
        nextState = reducer(state, actionWithWrongFeatureId);
        expect(nextState).toBe(state);
    });
});
