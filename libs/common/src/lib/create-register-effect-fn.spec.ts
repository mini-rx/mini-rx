import { Action } from './models';
import { createRegisterEffectFn } from './create-register-effect-fn';
import { createRxEffect } from './create-rx-effect';
import { Subject } from 'rxjs';
describe('createRegisterEffectFn', () => {
    const dispatchFn = jest.fn<void, [Action]>();
    const registerEffect = createRegisterEffectFn(dispatchFn);
    beforeEach(() => {
        dispatchFn.mockReset();
    });
    it('should register an effect', () => {
        const actions$ = new Subject<Action>();
        const someAction = { type: 'some action' };
        const effect = createRxEffect(actions$);
        registerEffect(effect);
        actions$.next(someAction);
        expect(dispatchFn).toHaveBeenCalledWith(someAction);
    });
    it('should register a non-dispatching effect', () => {
        const actions$ = new Subject<Action>();
        const someAction = { type: 'some action' };
        const effect = createRxEffect(actions$, { dispatch: false });
        registerEffect(effect);
        actions$.next(someAction);
        expect(dispatchFn).not.toHaveBeenCalled();
    });
});
