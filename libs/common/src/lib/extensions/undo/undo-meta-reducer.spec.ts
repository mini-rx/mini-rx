import { createUndoMetaReducer } from './undo-meta-reducer';
import { Action, Reducer } from '../../models';
import { undo } from './undo';
interface ActionWithPayload extends Action {
    payload?: any;
}
describe('createUndoMetaReducer', () => {
    const undoMetaReducer = createUndoMetaReducer(100);
    function createAppendAction(payload: string): ActionWithPayload {
        return { type: 'append', payload };
    }
    const appendReducer: Reducer<{
        counter: string;
    }> = (state = { counter: '1' }, action: ActionWithPayload) => {
        if (action.type === 'append') {
            return {
                ...state,
                counter: state.counter + action.payload,
            };
        }
        return state;
    };
    const reducer = undoMetaReducer(appendReducer);
    it('should undo action', () => {
        // Initial action is needed here to have at least one action in the `executedActions` Array (for calculating the `newState`)
        let state = reducer(undefined, { type: 'init' });
        const incrementAction = createAppendAction('2');
        state = reducer(state, incrementAction);
        expect(state).toEqual({ counter: '12' });
        state = reducer(state, undo(incrementAction));
        expect(state).toEqual({ counter: '1' });
    });
    it('should undo action in the middle', () => {
        // Initial action is needed here to have at least one action in the `executedActions` Array (for calculating the `newState`)
        let state = reducer(undefined, { type: 'init' });
        const append2Action = createAppendAction('2');
        state = reducer(state, append2Action);
        expect(state).toEqual({ counter: '12' });
        const append3Action = createAppendAction('3');
        state = reducer(state, append3Action);
        expect(state).toEqual({ counter: '123' });
        // Undo action in the middle
        state = reducer(state, undo(append2Action));
        expect(state).toEqual({ counter: '13' });
        const append4Action = createAppendAction('4');
        state = reducer(state, append4Action);
        expect(state).toEqual({ counter: '134' });
    });
    it('should buffer a limited amount of actions', () => {
        const undoMetaReducer = createUndoMetaReducer(3);
        const reducer = undoMetaReducer(appendReducer);
        let state = reducer(undefined, { type: 'init' });
        const append2Action = createAppendAction('2');
        state = reducer(state, append2Action);
        state = reducer(state, createAppendAction('3'));
        state = reducer(state, createAppendAction('4'));
        state = reducer(state, createAppendAction('5'));
        // append2Action is not in the `executedActions` Array anymore, because of the small buffer-size (3)
        // it is not possible anymore to undo append2Action:
        state = reducer(state, undo(append2Action));
        expect(state).toEqual({ counter: '12345' });
    });
});
