import { ImmutableStateExtension } from './immutable-state.extension';
import { ExtensionId } from '../../enums';
describe('ImmutableStateExtension', () => {
    const instance = new ImmutableStateExtension();
    it('should support ComponentStore', () => {
        expect(instance.hasCsSupport).toBe(true);
    });
    it('should have sort order', () => {
        expect(instance.sortOrder).toBe(0);
    });
    it('should have id', () => {
        expect(instance.id).toBe(ExtensionId.IMMUTABLE_STATE);
    });
    it('should have an init method which returns a function', () => {
        expect(typeof instance.init()).toBe('function');
    });
});
