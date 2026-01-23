import { Action } from './models';
import { ofType } from './of-type';
import { Subject } from 'rxjs';
const action1: Action = {
    type: 'updateUser',
};
const action2: Action = {
    type: 'updateProduct',
};
describe('ofType', () => {
    const actionsSubject = new Subject<Action>();
    it('should filter by action type', () => {
        const spy = jest.fn();
        actionsSubject.pipe(ofType('someType')).subscribe(spy);
        actionsSubject.next(action1);
        expect(spy).toHaveBeenCalledTimes(0);
        const spy2 = jest.fn();
        actionsSubject.pipe(ofType(action1.type)).subscribe(spy2);
        actionsSubject.next(action1);
        expect(spy2).toHaveBeenCalledWith(action1);
        expect(spy2).toHaveBeenCalledTimes(1);
    });
    it('should allow many types', () => {
        const spy = jest.fn();
        actionsSubject.pipe(ofType('someType', action1.type, action2.type)).subscribe(spy);
        actionsSubject.next(action1);
        actionsSubject.next(action2);
        expect(spy).toHaveBeenCalledTimes(2);
    });
});
