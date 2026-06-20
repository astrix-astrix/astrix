import { describe, expect, it } from 'vitest';
import { normalizeApiUrl } from './api-url';

describe('normalizeApiUrl', () => {
	it('normalizes configured API origins for browser calls', () => {
		expect(normalizeApiUrl(' http://localhost:3000/ ')).toBe('http://localhost:3000');
	});

	it('uses the current origin when no value is configured', () => {
		expect(normalizeApiUrl(undefined)).toBe('');
	});
});
