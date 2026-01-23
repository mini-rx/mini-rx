import { AppState, Reducer } from './models';
import { combineMetaReducers } from './combine-meta-reducers';
describe('combineMetaReducers', () => {
    it('should combine meta reducers', () => {
        // Meta Reducers are executed from left to right and before the app state reducer
        function rootMetaReducer1(reducer: Reducer<any>): Reducer<any> {
            return (state, action) => {
                if (action.type === 'metaTest') {
                    state = {
                        ...state,
                        metaTestFeature: state.metaTestFeature + 'b',
                    };
                }
                return reducer(state, action);
            };
        }
        function rootMetaReducer2(reducer: Reducer<any>): Reducer<any> {
            return (state, action) => {
                if (action.type === 'metaTest') {
                    state = {
                        ...state,
                        metaTestFeature: state.metaTestFeature + 'c',
                    };
                }
                return reducer(state, action);
            };
        }
        const appStateReducer: Reducer<AppState> = (state, action) => ({
            metaTestFeature: state['metaTestFeature'] + 'd',
        });
        const combinedMetaReducers = combineMetaReducers([rootMetaReducer1, rootMetaReducer2]);
        const reducer = combinedMetaReducers(appStateReducer);
        const state = reducer({ metaTestFeature: 'a' }, { type: 'metaTest' });
        expect(state).toEqual({
            metaTestFeature: 'abcd',
        });
    });
});
