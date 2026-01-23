import { undo } from './undo';
import { Action } from '../../models';
describe('undo', () => {
    it('should create an undo action', () => {
        const actionToUndo: Action = { type: 'someAction' };
        expect(undo(actionToUndo)).toEqual({ type: '@mini-rx/undo', payload: actionToUndo });
    });
});
