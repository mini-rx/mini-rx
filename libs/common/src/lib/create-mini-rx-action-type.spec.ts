import { createMiniRxActionType } from './create-mini-rx-action-type';
import { OperationType } from './models';
describe('createMiniRxActionType', () => {
    it('should create a MiniRx Action Type', () => {
        const featureKey = 'todos';
        const storeInit = createMiniRxActionType(OperationType.INIT);
        expect(storeInit).toBe('@mini-rx/init');
        const featureInit = createMiniRxActionType(OperationType.INIT, featureKey);
        expect(featureInit).toBe('@mini-rx/todos/init');
        const featureDestroy = createMiniRxActionType(OperationType.DESTROY, featureKey);
        expect(featureDestroy).toBe('@mini-rx/todos/destroy');
        const connection = createMiniRxActionType(OperationType.CONNECTION, featureKey, 'someKey');
        expect(connection).toBe('@mini-rx/todos/connection/someKey');
        const setState = createMiniRxActionType(OperationType.SET_STATE, featureKey);
        expect(setState).toBe('@mini-rx/todos/set-state');
        const setStateWithName = createMiniRxActionType(
            OperationType.SET_STATE,
            featureKey,
            'someName'
        );
        expect(setStateWithName).toBe('@mini-rx/todos/set-state/someName');
    });
});
