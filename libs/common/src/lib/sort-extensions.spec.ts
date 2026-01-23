import { MetaReducer, StoreExtension } from './models';
import { sortExtensions } from './sort-extensions';
describe('sortExtensions', () => {
    class Extension1 implements StoreExtension {
        id = 1;
        sortOrder = 3;
        init(): MetaReducer<any> {
            return (v) => v;
        }
    }
    class Extension2 implements StoreExtension {
        id = 2;
        sortOrder = 2;
        init(): MetaReducer<any> {
            return (v) => v;
        }
    }
    class Extension3 implements StoreExtension {
        id = 3;
        sortOrder = 1;
        init(): MetaReducer<any> {
            return (v) => v;
        }
    }
    it('should sort extensions', () => {
        const extensions = [new Extension1(), new Extension2(), new Extension3()];
        expect(sortExtensions(extensions)).toEqual(
            expect.objectContaining([
                { id: 3, sortOrder: 1 },
                { id: 2, sortOrder: 2 },
                { id: 1, sortOrder: 3 },
            ])
        );
    });
});
