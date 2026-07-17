import { ReduxDevtoolsExtension } from '../extensions/redux-devtools.extension';
import { AppState } from '@mini-rx/common';
describe('extensions', () => {
    describe('ReduxDevTools', () => {
        const extension = new ReduxDevtoolsExtension({});
        it('should expose actions', () => {
            expect(extension.actions$).toBeDefined();
        });
        it('should read state from Store', () => {
            expect(extension.readState()).toEqual({});
        });
        it('should update Store state', () => {
            const newState: AppState = {};
            extension.updateState(newState);
            expect(extension.readState()).toEqual(newState);
        });
    });
});
