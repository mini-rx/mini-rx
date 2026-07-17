import { generateId, urlAlphabet } from './generate-id';
describe('generateId', () => {
    it('should generate an id of 6 characters long', () => {
        const id = generateId();
        expect(id.length).toEqual(6);
        id.split('').forEach((char: string) => {
            expect(urlAlphabet.includes(char)).toBe(true);
        });
    });
});
