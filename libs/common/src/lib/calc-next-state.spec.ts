import { calcNextState } from './calc-next-state';
describe('calcNextState', () => {
    it('should calculate next state', () => {
        const currentState = { count: 1 };
        expect(calcNextState(currentState, { count: 2 })).toEqual({ count: 2 });
        // Witch callback
        expect(calcNextState(currentState, (state) => ({ count: state.count + 2 }))).toEqual({
            count: 3,
        });
    });
});
