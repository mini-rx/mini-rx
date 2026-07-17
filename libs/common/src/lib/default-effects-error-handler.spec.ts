import { of, Subject, switchMap } from 'rxjs';
import { defaultEffectsErrorHandler } from './default-effects-error-handler';
describe('defaultEffectsErrorHandler', () => {
    function getErrorMsg(times: number) {
        return `@mini-rx: An error occurred in the Effect. MiniRx resubscribed the Effect automatically and will do so ${times} more times.`;
    }
    it('should resubscribe the effect 10 times (if side effect error is not handled)', () => {
        const spy = jest.fn();
        console.error = jest.fn();
        function apiCallWithError() {
            spy();
            throw new Error();
            return of('someValue');
        }
        const actions = new Subject<void>();
        const effect = actions.pipe(switchMap(() => apiCallWithError()));
        const effectWithDefaultErrorHandler = defaultEffectsErrorHandler(effect);
        effectWithDefaultErrorHandler.subscribe();
        actions.next();
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(9)),
            expect.any(Error)
        );
        actions.next();
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(8)),
            expect.any(Error)
        );
        actions.next();
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(7)),
            expect.any(Error)
        );
        actions.next();
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(6)),
            expect.any(Error)
        );
        actions.next();
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(5)),
            expect.any(Error)
        );
        actions.next();
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(4)),
            expect.any(Error)
        );
        actions.next();
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(3)),
            expect.any(Error)
        );
        actions.next();
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(2)),
            expect.any(Error)
        );
        actions.next();
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(1)),
            expect.any(Error)
        );
        actions.next();
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(getErrorMsg(0)),
            expect.any(Error)
        );
        actions.next();
        expect(console.error).toHaveBeenCalledTimes(10);
        expect(spy).toHaveBeenCalledTimes(11);
        actions.next(); // #12 will not trigger the Api call anymore, no error is logged
        actions.next(); // #13 will not trigger the Api call anymore, no error is logged
        expect(console.error).toHaveBeenCalledTimes(10); // Re-subscription with error logging stopped after 10 times
        expect(spy).toHaveBeenCalledTimes(11); // Api call is performed 11 Times. First time + 10 re-subscriptions
    });
});
