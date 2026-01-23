import { createActionsOnQueue } from './actions-on-queue';
import { take } from 'rxjs';
describe('ActionsOnQueue', () => {
    it('should dispatch actions', () => {
        const spy = jest.fn();
        const actionsOnQueue = createActionsOnQueue();
        actionsOnQueue.actions$.subscribe(spy);
        const action = { type: 'someAction' };
        actionsOnQueue.dispatch(action);
        expect(spy).toHaveBeenCalledWith(action);
    });
    it('should queue actions', () => {
        // Without queueScheduler this test would fail because of stack overflow (Read more here: https://blog.cloudboost.io/so-how-does-rx-js-queuescheduler-actually-work-188c1b46526e)
        const callLimit = 5000;
        const actionsOnQueue = createActionsOnQueue();
        const spy = jest.fn().mockImplementation(() => {
            // Every received action dispatches another action
            actionsOnQueue.dispatch({ type: 'someAction' });
        });
        actionsOnQueue.actions$.pipe(take(callLimit)).subscribe(spy);
        actionsOnQueue.dispatch({ type: 'someInitialAction' }); // Dispatch an action to start the whole thing
        expect(spy).toHaveBeenCalledTimes(callLimit);
    });
});
