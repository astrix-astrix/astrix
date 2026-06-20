import { defineConfig } from '@playwright/test';

export default defineConfig({
	use: { baseURL: 'http://127.0.0.1:4173/admin/' },
	webServer: {
		command: 'npm run build && npm run preview -- --host 127.0.0.1',
		url: 'http://127.0.0.1:4173/admin/'
	},
	testMatch: '**/*.e2e.{ts,js}'
});
