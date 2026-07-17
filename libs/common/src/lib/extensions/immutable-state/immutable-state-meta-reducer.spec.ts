import { Action, Reducer } from '../../models';
import { immutableStateMetaReducer } from './immutable-state-meta-reducer';
describe('immutableStateMetaReducer', () => {
    function counterReducerWithMutation(
        state: {
            counter: number;
        } = { counter: 1 },
        action: Action
    ) {
        switch (action.type) {
            case 'counterWithoutMutation':
                return {
                    ...state,
                    counter: state.counter + 1,
                };
            case 'counterWithMutation':
                state.counter = 123; // mutate
                return {
                    ...state,
                    counter: state.counter + 1,
                };
            default:
                return state;
        }
    }
    it('should throw when mutating state in the reducer', () => {
        const frozenReducer: Reducer<any> = immutableStateMetaReducer(counterReducerWithMutation);
        expect(() => frozenReducer({ counter: 1 }, { type: 'counterWithMutation' })).toThrow();
    });
    it('should throw when mutating state returned by the reducer', () => {
        const frozenReducer: Reducer<any> = immutableStateMetaReducer(counterReducerWithMutation);
        const state = frozenReducer({ counter: 1 }, { type: 'counterWithoutMutation' });
        expect(() => (state.counter = 123)).toThrow();
    });
});
