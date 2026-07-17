import { Action } from './models';
import { createStore } from './create-store';
import { UndoExtension } from './extensions/undo/undo-extension';
interface CounterState {
    counter: number;
}
const counterInitialState: CounterState = {
    counter: 1,
};
function counterReducer(state: CounterState = counterInitialState, action: Action) {
    switch (action.type) {
        case 'inc':
            return {
                ...state,
                counter: state.counter + 1,
            };
        default:
            return state;
    }
}
describe('createStore', () => {
    let store: ReturnType<typeof createStore>;
    it('should create a store', () => {
        function createState<T extends object>(initialState: T) {
            let state: T = initialState;
            return {
                set: (v: T) => (state = v),
                get: (): T => state,
                select: (): T => state,
            };
        }
        store = createStore(createState({}));
        expect(store.appState.get()).toEqual({});
    });
    it('should add reducers with configureStore', () => {
        store.configureStore({
            reducers: {
                counter: counterReducer,
            },
        });
        store.dispatch({ type: 'inc' });
        expect(store.appState.get()).toEqual({
            counter: {
                counter: 2,
            },
        });
    });
    it('should add a reducer with addFeature', () => {
        store.addFeature('counter2', counterReducer);
        expect(store.appState.get()).toEqual({
            counter: {
                counter: 2,
            },
            counter2: {
                counter: 1,
            },
        });
    });
    it('should remove a reducer with removeFeature', () => {
        store.removeFeature('counter2');
        expect(store.appState.get()).toEqual({
            counter: {
                counter: 2,
            },
        });
    });
    it('should add an extension', () => {
        store.addExtension(new UndoExtension());
        expect(store.hasUndoExtension).toBe(true);
    });
});
