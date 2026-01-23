import {
    AbstractReduxDevtoolsExtension,
    ReduxDevtoolsOptions,
} from './abstract-redux-devtools-extension';
import { ExtensionId } from '../../enums';
import { Observable, Subject } from 'rxjs';
import { Action, AppState, OperationType } from '../../models';
import { createMiniRxActionType } from '../../create-mini-rx-action-type';
const win = window as any;
JSON.parse = jest.fn().mockImplementationOnce((data) => {
    return data;
});
const action: Action = { type: 'counter' };
const sendFn = jest.fn();
const subscribeFn = jest.fn();
const connectFn = jest.fn().mockImplementation(() => {
    return {
        subscribe: subscribeFn,
        send: sendFn,
    };
});
const actions$ = new Subject<Action>();
const initialState = { counter: 1 };
let appState: AppState = initialState;
const updateState = jest.fn().mockImplementation((state) => {
    appState = state;
});
const resetState = () => (appState = initialState);
class ReduxDevToolsExtension extends AbstractReduxDevtoolsExtension {
    get actions$(): Observable<Action> {
        return actions$;
    }
    readState(): AppState {
        return appState;
    }
    updateState(state: AppState): void {
        updateState(state);
    }
}
describe('AbstractReduxDevtoolsExtension', () => {
    win.__REDUX_DEVTOOLS_EXTENSION__ = {
        connect: connectFn,
    };
    const options: Partial<ReduxDevtoolsOptions> = {
        name: 'test',
        maxAge: 50,
        latency: 1000,
        traceLimit: 25,
    };
    const extension = new ReduxDevToolsExtension(options);
    beforeEach(() => {
        sendFn.mockReset();
    });
    it('should not support ComponentStore', () => {
        expect(extension).not.toHaveProperty('hasCsSupport');
    });
    it('should have sort order', () => {
        expect(extension.sortOrder).toBe(0);
    });
    it('should have id', () => {
        expect(extension.id).toBe(ExtensionId.REDUX_DEVTOOLS);
    });
    it('should connect to Store', () => {
        extension.init();
        expect(connectFn).toHaveBeenCalledTimes(1);
        expect(connectFn).toHaveBeenCalledWith(options);
        expect(subscribeFn).toHaveBeenCalledTimes(1);
    });
    it('should receive state and actions', () => {
        actions$.next(action);
        expect(sendFn).toHaveBeenCalledTimes(1);
        expect(sendFn).toHaveBeenCalledWith(action, { counter: 1 });
    });
    it('should update the Store state', () => {
        const stateFromReduxDevTools = {
            someProp: 'someValue',
        };
        extension['onDevToolsMessage']({
            type: 'DISPATCH',
            payload: {
                type: 'JUMP_TO_STATE',
            },
            state: stateFromReduxDevTools,
        });
        expect(updateState).toHaveBeenCalledTimes(1);
        expect(updateState).toHaveBeenCalledWith(stateFromReduxDevTools);
        updateState.mockReset();
        extension['onDevToolsMessage']({
            type: 'NOT_SUPPORTED_TYPE',
            payload: {},
            state: {},
        });
        expect(updateState).toHaveBeenCalledTimes(0);
    });
    it('should receive state and a SetStateAction with only type and payload', () => {
        resetState();
        const stateOrCallback = () => ({
            firstName: 'Cage',
        });
        actions$.next({
            type: createMiniRxActionType(OperationType.SET_STATE, 'user'),
            stateOrCallback,
            featureId: 'abc',
        });
        expect(sendFn).toHaveBeenCalledTimes(1);
        expect(sendFn).toHaveBeenCalledWith(
            {
                type: '@mini-rx/user/set-state',
                payload: stateOrCallback,
            },
            initialState
        );
    });
});
