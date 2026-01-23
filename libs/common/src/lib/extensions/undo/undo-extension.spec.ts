import { UndoExtension } from './undo-extension';
import { ExtensionId } from '../../enums';
describe('UndoExtension', () => {
    const instance = new UndoExtension();
    it('should support ComponentStore', () => {
        expect(instance.hasCsSupport).toBe(true);
    });
    it('should have sort order', () => {
        expect(instance.sortOrder).toBe(1);
    });
    it('should have id', () => {
        expect(instance.id).toBe(ExtensionId.UNDO);
    });
    it('should have an init method which returns a function', () => {
        expect(typeof instance.init()).toBe('function');
    });
});
