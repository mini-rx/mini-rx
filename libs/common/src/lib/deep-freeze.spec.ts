import { deepFreeze } from './deep-freeze';
// These unit tests were created with ChatGPT: https://chat.openai.com/share/f2a078c9-e996-4d4e-8c4c-725ca2e9cafd
describe('deepFreeze', () => {
    it('should make object immutable', () => {
        const obj = { count: 1 };
        deepFreeze(obj);
        expect(Object.isFrozen(obj)).toBe(true);
        expect(() => (obj.count = 2)).toThrow();
        const obj2 = {
            nestedCounter: {
                count: 1,
            },
        };
        deepFreeze(obj2);
        expect(Object.isFrozen(obj2.nestedCounter)).toBe(true);
        expect(() => (obj2.nestedCounter.count = 2)).toThrow();
    });
    it('should freeze a function object', () => {
        const fn = (): number => {
            return 42;
        };
        expect(() => deepFreeze(fn)).not.toThrow();
        expect(Object.isFrozen(fn)).toBe(true);
    });
    it('should handle circular references', () => {
        const circularObj: {
            prop1: number;
            circularRef: any;
        } = { prop1: 42, circularRef: undefined };
        circularObj.circularRef = circularObj;
        expect(() => deepFreeze(circularObj)).not.toThrow();
        // Ensure circular references do not result in infinite loops
        expect(Object.isFrozen(circularObj)).toBe(true);
    });
    // Arrays
    it('should freeze an array and its elements', () => {
        const arr = [1, 2, 3];
        expect(() => deepFreeze(arr)).not.toThrow();
        expect(Object.isFrozen(arr)).toBe(true);
        expect(Object.isFrozen(arr[0])).toBe(true);
    });
    // Nested Objects and Arrays
    it('should freeze nested objects and arrays', () => {
        const nestedObj = { arr: [1, 2, { nestedProp: 'value' }] };
        expect(() => deepFreeze(nestedObj)).not.toThrow();
        // Test that nestedObj, its properties, and elements are frozen
        expect(Object.isFrozen(nestedObj)).toBe(true);
        expect(Object.isFrozen(nestedObj.arr)).toBe(true);
        expect(Object.isFrozen(nestedObj.arr[2])).toBe(true);
    });
    // Mixed Types
    it('should freeze objects with mixed types', () => {
        const mixedObj = {
            str: 'immutable',
            num: 42,
            bool: true,
            fn: () => {
                return;
            },
            nested: {
                arr: [1, 2, { objProp: 'value' }],
            },
        };
        expect(() => deepFreeze(mixedObj)).not.toThrow();
        // Test that mixedObj and all its properties of different types are frozen
        expect(Object.isFrozen(mixedObj)).toBe(true);
        expect(Object.isFrozen(mixedObj.nested.arr[2])).toBe(true);
    });
    // Arrays with Objects
    it('should freeze arrays with objects', () => {
        const arrOfObjs = [{ prop: 'value' }, { nested: { prop: 'value' } }];
        expect(() => deepFreeze(arrOfObjs)).not.toThrow();
        // Test that arrOfObjs and its elements are frozen
        expect(Object.isFrozen(arrOfObjs)).toBe(true);
        expect(Object.isFrozen(arrOfObjs[0])).toBe(true);
        expect(Object.isFrozen(arrOfObjs[1].nested)).toBe(true);
    });
});
