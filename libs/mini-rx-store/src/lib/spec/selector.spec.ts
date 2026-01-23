// Credits to NgRx: https://github.com/ngrx/platform/blob/8.6.0/modules/store/spec/selector.spec.ts
import { createSelector } from '../selector';
describe('Selectors', () => {
    let countOne: number;
    let countTwo: number;
    let countThree: number;
    let incrementOne: jasmine.Spy;
    let incrementTwo: jasmine.Spy;
    let incrementThree: jasmine.Spy;
    beforeEach(() => {
        countOne = 0;
        countTwo = 0;
        countThree = 0;
        incrementOne = jasmine.createSpy('incrementOne').and.callFake(() => {
            return ++countOne;
        });
        incrementTwo = jasmine.createSpy('incrementTwo').and.callFake(() => {
            return ++countTwo;
        });
        incrementThree = jasmine.createSpy('incrementThree').and.callFake(() => {
            return ++countThree;
        });
    });
    describe('createSelector', () => {
        it('should deliver the value of selectors to the projection function', () => {
            const projectFn = jasmine.createSpy('projectionFn');
            createSelector(incrementOne, incrementTwo, projectFn)({});
            expect(projectFn).toHaveBeenCalledWith(countOne, countTwo);
        });
        it('should call the projector function only when the value of a dependent selector change', () => {
            const firstState = { first: 'state', unchanged: 'state' };
            const secondState = { second: 'state', unchanged: 'state' };
            const neverChangingSelector = jasmine
                .createSpy('unchangedSelector')
                .and.callFake((state: any) => {
                    return state.unchanged;
                });
            const projectFn = jasmine.createSpy('projectionFn');
            const selector = createSelector(neverChangingSelector, projectFn);
            selector(firstState);
            selector(secondState);
            expect(projectFn).toHaveBeenCalledTimes(1);
        });
        it('should memoize the function', () => {
            const firstState = { first: 'state' };
            const secondState = { second: 'state' };
            const projectFn = jasmine.createSpy('projectionFn');
            const selector = createSelector(incrementOne, incrementTwo, incrementThree, projectFn);
            selector(firstState);
            selector(firstState);
            selector(firstState);
            selector(secondState);
            selector(secondState);
            expect(incrementOne).toHaveBeenCalledTimes(2);
            expect(incrementTwo).toHaveBeenCalledTimes(2);
            expect(incrementThree).toHaveBeenCalledTimes(2);
            expect(projectFn).toHaveBeenCalledTimes(2);
        });
        it('should not memoize last successful projection result in case of error', () => {
            const firstState = { ok: true };
            const secondState = { ok: false };
            const fail = () => {
                throw new Error();
            };
            const projectorFn = jasmine
                .createSpy('projectorFn', (s: any) => (s.ok ? s.ok : fail()))
                .and.callThrough();
            const selectorFn = jasmine
                .createSpy(
                    'selectorFn',
                    createSelector((state) => state, projectorFn)
                )
                .and.callThrough();
            selectorFn(firstState);
            expect(() => selectorFn(secondState)).toThrow(new Error());
            expect(() => selectorFn(secondState)).toThrow(new Error());
            selectorFn(firstState);
            expect(selectorFn).toHaveBeenCalledTimes(4);
            expect(projectorFn).toHaveBeenCalledTimes(3);
        });
        it('should create a selector from selectors dictionary', () => {
            interface State {
                x: number;
                y: string;
            }
            const selectX = (state: State) => state.x + 1;
            const selectY = (state: State) => state.y;
            const selectDictionary = createSelector({
                s: selectX,
                m: selectY,
            });
            expect(selectDictionary({ x: 1, y: 'mini-rx' })).toEqual({
                s: 2,
                m: 'mini-rx',
            });
            expect(selectDictionary({ x: 2, y: 'mini-rx' })).toEqual({
                s: 3,
                m: 'mini-rx',
            });
        });
        it('should create a selector from empty dictionary', () => {
            const selectDictionary = createSelector({});
            expect(selectDictionary({ x: 1, y: 'mini-rx' })).toEqual({});
            expect(selectDictionary({ x: 2, y: 'store' })).toEqual({});
        });
    });
});
