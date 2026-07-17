import { Reducer } from '../../models';
import { loggerMetaReducer } from './logger-meta-reducer';
describe('loggerMetaReducer', () => {
    console.log = jest.fn();
    it('should log action and state', () => {
        const reducer: Reducer<{
            counter: number;
        }> = (state, action) => {
            if (action.type === 'inc') {
                return {
                    ...state,
                    counter: state.counter + 1,
                };
            }
            return state;
        };
        const reducerWithMetaReducer = loggerMetaReducer(reducer);
        const action = { type: 'inc' };
        reducerWithMetaReducer({ counter: 1 }, action);
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('inc'),
            expect.stringContaining('color: #25c2a0'),
            expect.stringContaining('Action:'),
            action,
            expect.stringContaining('State: '),
            { counter: 2 }
        );
    });
});
