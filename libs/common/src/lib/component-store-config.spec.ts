import { componentStoreConfig } from './component-store-config';
import { ExtensionId } from './enums';
import { ComponentStoreExtension, MetaReducer } from './models';
describe('componentStoreConfig', () => {
    it('should set and get Component Store config', () => {
        const extension: ComponentStoreExtension = {
            id: ExtensionId.LOGGER,
            sortOrder: 1,
            init(): MetaReducer<any> {
                return (v) => v;
            },
            hasCsSupport: true,
        };
        const config = componentStoreConfig();
        config.set({ extensions: [extension] });
        expect(config.get()).toEqual({ extensions: [extension] });
    });
    it('should throw if config is already set', () => {
        const config = componentStoreConfig();
        config.set({ extensions: [] });
        expect(() => config.set({ extensions: [] })).toThrow();
    });
});
