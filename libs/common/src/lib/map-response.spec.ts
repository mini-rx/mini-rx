import { concatMap, finalize, noop, Observable, of, throwError } from 'rxjs';
import { Action } from './models';
import { mapResponse } from './map-response';
describe('mapResponse', () => {
    it('should invoke next callback on next', () => {
        const nextCallback = jest.fn<Action, [number]>();
        of(1, 2, 3).pipe(mapResponse(nextCallback, noop)).subscribe();
        expect(nextCallback.mock.calls).toEqual([[1], [2], [3]]);
    });
    it('should invoke error callback on error', () => {
        const nextCallback = jest.fn<Action, [number]>();
        const errorCallback = jest.fn<
            Action,
            [
                {
                    message: string;
                }
            ]
        >();
        const error = { message: 'error' };
        throwError(() => error)
            .pipe(mapResponse(nextCallback, errorCallback))
            .subscribe();
        expect(errorCallback).toHaveBeenCalledWith(error);
    });
    it('should not unsubscribe from outer observable on inner observable error', () => {
        const innerCompleteCallback = jest.fn<void, []>();
        const outerCompleteCallback = jest.fn<void, []>();
        new Observable((subscriber) => subscriber.next(1))
            .pipe(
                concatMap(() =>
                    throwError(() => 'error').pipe(
                        mapResponse(() => ({ type: 'some action' }), noop),
                        finalize(innerCompleteCallback)
                    )
                ),
                finalize(outerCompleteCallback)
            )
            .subscribe();
        expect(innerCompleteCallback).toHaveBeenCalled();
        expect(outerCompleteCallback).not.toHaveBeenCalled();
    });
    it('should return one action on next', () => {
        const spy = jest.fn<void, [Action | Action[]]>();
        const action: Action = { type: 'action1' };
        of(1)
            .pipe(mapResponse(() => action, noop))
            .subscribe((v) => spy(v));
        expect(spy.mock.calls).toEqual([[action]]);
    });
    it('should return many actions on next', () => {
        const spy = jest.fn<void, [Action | Action[]]>();
        const action1: Action = { type: 'action1' };
        const action2: Action = { type: 'action2' };
        of(1)
            .pipe(mapResponse(() => [action1, action2], noop))
            .subscribe((v) => spy(v));
        expect(spy.mock.calls).toEqual([[action1], [action2]]);
    });
    it('should (optionally) return one or many action on error', () => {
        const nextCallback = jest.fn<Action | Action, [number]>();
        const error = { message: 'error' };
        const action1: Action = { type: 'action1' };
        const action2: Action = { type: 'action1' };
        const spy = jest.fn<void, [Action | Action[]]>();
        // One Action
        throwError(() => error)
            .pipe(mapResponse(nextCallback, () => action1))
            .subscribe(spy);
        expect(spy.mock.calls).toEqual([[action1]]);
        spy.mockReset();
        // Many Actions
        throwError(() => error)
            .pipe(mapResponse(nextCallback, () => [action1, action2]))
            .subscribe(spy);
        expect(spy.mock.calls).toEqual([[action1], [action2]]);
        spy.mockReset();
        // No Action
        throwError(() => error)
            .pipe(mapResponse(nextCallback, noop))
            .subscribe(spy);
        expect(spy).not.toHaveBeenCalled();
    });
});
