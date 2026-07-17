import { beautifyAction } from './beautify-action';
import { MiniRxAction, OperationType } from './models';
import { createMiniRxActionType } from './create-mini-rx-action-type';
describe('beautifyAction', () => {
    it('should remove extra fields from FeatureStore/ComponentStore Actions', () => {
        const csAction: MiniRxAction<any> = {
            type: createMiniRxActionType(OperationType.SET_STATE, 'todos'),
            stateOrCallback: {},
        };
        expect(beautifyAction(csAction)).toEqual({
            type: '@mini-rx/todos/set-state',
            payload: {},
        });
        const fsAction: MiniRxAction<any> = {
            type: createMiniRxActionType(OperationType.SET_STATE, 'todos'),
            stateOrCallback: {},
            featureId: 'someFeatureId',
        };
        expect(beautifyAction(fsAction)).toEqual({
            type: '@mini-rx/todos/set-state',
            payload: {},
        });
    });
    it('should not touch other normal Actions', () => {
        const action = { type: 'someAction' };
        expect(beautifyAction(action)).toBe(action);
    });
});
