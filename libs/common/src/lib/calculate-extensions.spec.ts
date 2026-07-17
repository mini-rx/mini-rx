import { ComponentStoreExtension, MetaReducer } from './models';
import { ExtensionId } from './enums';
import { calculateExtensions } from './calculate-extensions';
class MockLoggerExtension implements ComponentStoreExtension {
    id = ExtensionId.LOGGER;
    sortOrder = 1;
    hasCsSupport = true as const;
    init(): MetaReducer<any> {
        return (v) => v;
    }
}
class MockUndoExtension implements ComponentStoreExtension {
    id = ExtensionId.UNDO;
    sortOrder = 2;
    hasCsSupport = true as const;
    init(): MetaReducer<any> {
        return (v) => v;
    }
}
class MockImmutableStateExtension implements ComponentStoreExtension {
    id = ExtensionId.IMMUTABLE_STATE;
    sortOrder = 3;
    hasCsSupport = true as const;
    init(): MetaReducer<any> {
        return (v) => v;
    }
}
describe('calculateExtensions', () => {
    it('should add local extensions', () => {
        const extensions = [new MockLoggerExtension(), new MockUndoExtension()];
        expect(calculateExtensions({ extensions })).toStrictEqual(extensions);
    });
    it('should add global extensions', () => {
        const extensions = [new MockLoggerExtension(), new MockUndoExtension()];
        expect(calculateExtensions(undefined, { extensions })).toStrictEqual(extensions);
    });
    it('should merge local and global extensions', () => {
        const localExtensions = [new MockLoggerExtension()];
        const globalExtensions = [new MockUndoExtension(), new MockImmutableStateExtension()];
        const extensions = calculateExtensions(
            { extensions: localExtensions },
            { extensions: globalExtensions }
        );
        expect(extensions[0]).toBe(localExtensions[0]);
        expect(extensions[1]).toBe(globalExtensions[0]);
        expect(extensions[2]).toBe(globalExtensions[1]);
    });
    it('should merge local and global extensions (use local if extension is used globally and locally)', () => {
        const localExtensions = [new MockLoggerExtension()];
        const globalExtensions = [new MockLoggerExtension(), new MockImmutableStateExtension()];
        const extensions = calculateExtensions(
            { extensions: localExtensions },
            { extensions: globalExtensions }
        );
        expect(extensions[0]).toBe(localExtensions[0]);
        expect(extensions[1]).toBe(globalExtensions[1]);
    });
    it('should return empty extensions if no global or local extensions are defined', () => {
        const extensions = calculateExtensions();
        expect(extensions).toEqual([]);
    });
    it('should sort extensions', () => {
        const extensions = [new MockImmutableStateExtension(), new MockLoggerExtension()];
        const extensionsSorted = calculateExtensions({ extensions });
        expect(extensionsSorted[0]).toBe(extensions[1]);
        expect(extensionsSorted[1]).toBe(extensions[0]);
    });
});
