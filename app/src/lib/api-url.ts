const DEFAULT_API_URL = '';

export function normalizeApiUrl(value: string | undefined): string {
	const normalized = value?.trim() ?? DEFAULT_API_URL;
	return normalized.replace(/\/+$/, '');
}
