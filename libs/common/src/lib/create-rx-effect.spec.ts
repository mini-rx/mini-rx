import { createRxEffect, hasEffectMetaData } from './create-rx-effect';
import { Observable, of } from 'rxjs';
import { Action } from './models';
describe('createRxEffect', () => {
    it('should dispatch by default', () => {
        const actionStream$: Observable<Action> = of({ type: 'someAction' });
        const effect = createRxEffect(actionStream$);
        expect(effect['@mini-rx/effectMetaData']).toEqual(
            expect.objectContaining({ dispatch: true })
        );
    });
    it('should be possible to create a non-dispatching effect', () => {
        const actionStream$: Observable<Action> = of({ type: 'someAction' });
        const effect = createRxEffect(actionStream$, {
            dispatch: false,
        });
        expect(effect['@mini-rx/effectMetaData']).toEqual(
            expect.objectContaining({ dispatch: false })
        );
    });
    it('should be possible to create a non-dispatching effect returning a non-action', () => {
        const effect = createRxEffect(of('foo'), {
            dispatch: false,
        });
        expect(effect['@mini-rx/effectMetaData']).toEqual(
            expect.objectContaining({ dispatch: false })
        );
    });
});
describe('hasEffectMetaData', () => {
    it('should detect meta data', () => {
        expect(hasEffectMetaData(createRxEffect(of({ type: 'someAction' })))).toBe(true);
    });
    it('should NOT detect meta data', () => {
        expect(hasEffectMetaData(of({ type: 'someAction' }))).toBe(false);
    });
});
