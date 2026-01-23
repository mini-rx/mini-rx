import { isMiniRxAction } from './is-mini-rx-action';
import { Action, MiniRxAction } from './models';
describe('isMiniRxAction', () => {
    it('should detect MiniRx action', () => {
        const action: MiniRxAction<any> = {
            type: '',
            stateOrCallback: {},
        };
        expect(isMiniRxAction(action)).toBe(true);
        const action2: Action = {
            type: 'abc',
        };
        expect(isMiniRxAction(action2)).toBe(false);
    });
});
