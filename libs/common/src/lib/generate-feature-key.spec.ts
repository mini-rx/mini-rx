import { generateFeatureKey } from './generate-feature-key';
describe('generateFeatureKey', () => {
    it('should generate a feature key', () => {
        const featureKey = generateFeatureKey('feature');
        expect(featureKey).toBe('feature');
    });
    it('should generate a feature key with multi true (same feature key is used multiple times)', () => {
        const featureKey = generateFeatureKey('feature', true);
        expect(featureKey).toContain('feature-');
    });
});
