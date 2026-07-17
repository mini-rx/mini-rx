import { createSubSink } from './sub-sink';
import { Subject } from 'rxjs';
describe('subSink', () => {
    it('should unsubscribe all Subscriptions', () => {
        const subSink = createSubSink();
        const subject1 = new Subject<void>();
        const spy1 = jest.fn();
        const subject2 = new Subject<void>();
        const spy2 = jest.fn();
        subSink.sink = subject1.subscribe(spy1);
        subSink.sink = subject2.subscribe(spy2);
        subject1.next();
        subject2.next();
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        subject1.next();
        subject2.next();
        expect(spy1).toHaveBeenCalledTimes(2);
        expect(spy2).toHaveBeenCalledTimes(2);
        subSink.unsubscribe();
        subject1.next();
        subject2.next();
        expect(spy1).toHaveBeenCalledTimes(2);
        expect(spy2).toHaveBeenCalledTimes(2);
    });
    it('should throw when adding subscriptions after unsubscribe', () => {
        const subSink = createSubSink();
        const subject = new Subject();
        subSink.sink = subject.subscribe();
        subSink.unsubscribe();
        expect(() => (subSink.sink = subject.subscribe())).toThrow();
    });
});
