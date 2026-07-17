import { Action, Reducer } from './models';
import { combineReducers } from './combine-reducers';
const action1: Action = {
    type: 'showProductCode',
};
const action2: Action = {
    type: 'showProductCode2',
};
const action3: Action = {
    type: 'showProductCode3',
};
function reducer1(state: any, action: Action): any {
    switch (action.type) {
        case action1.type:
            return {
                ...state,
                showProductCode: true,
            };
        default:
            return state;
    }
}
function reducer2(state: any, action: Action): any {
    switch (action.type) {
        case action2.type:
            return {
                ...state,
                showProductCode2: false,
            };
        default:
            return state;
    }
}
function reducer3(state: any, action: Action): any {
    switch (action.type) {
        case action3.type:
            return {
                ...state,
                showProductCode3: undefined,
            };
        default:
            return state;
    }
}
describe('combineReducers', () => {
    it('should combine reducers', () => {
        const combinedReducer: Reducer<any> = combineReducers({
            feature1: reducer1,
            feature2: reducer2,
        });
        const newState = combinedReducer({}, action1);
        expect(newState).toEqual({ feature1: { showProductCode: true } });
        const newState2 = combinedReducer(newState, action2);
        expect(newState2).toEqual({
            feature1: { showProductCode: true },
            feature2: { showProductCode2: false },
        });
        const combinedReducer2 = combineReducers({
            feature1: reducer1,
            feature2: reducer2,
            feature3: reducer3,
        });
        const newState3 = combinedReducer2(newState2, action3);
        expect(newState3).toEqual({
            feature1: { showProductCode: true },
            feature2: { showProductCode2: false },
            feature3: { showProductCode3: undefined },
        });
    });
    it('should remove keys from state which are not present in the reducer map', () => {
        const combinedReducer: Reducer<any> = combineReducers({
            feature1: reducer1,
            feature2: reducer2,
        });
        const newState = combinedReducer(
            {
                feature1: { showProductCode: true },
                feature2: { showProductCode2: false },
                feature3: { showProductCode2: false },
            },
            action2
        );
        expect(newState).toEqual({
            feature1: { showProductCode: true },
            feature2: { showProductCode2: false },
        });
    });
    it('should fallback to an empty object as initial state', () => {
        const combinedReducer: Reducer<any> = combineReducers({});
        const newState = combinedReducer(undefined, { type: 'someAction' });
        expect(newState).toEqual({});
    });
});
