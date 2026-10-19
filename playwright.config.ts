import { defineConfig, devices } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dataDirectory = mkdtempSync(join(tmpdir(), 'situation-e2e-'));

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:4187',
		trace: 'on-first-retry',
		launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
			? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
			: undefined
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: 'node build',
		url: 'http://localhost:4187/login',
		reuseExistingServer: false,
		env: {
			PORT: '4187',
			HOST: 'localhost',
			ORIGIN: 'http://localhost:4187',
			AUTH_TRUST_HOST: 'true',
			AUTH_GOOGLE_ID: 'e2e-test.apps.googleusercontent.com',
			AUTH_GOOGLE_SECRET: 'e2e-google-placeholder',
			AUTH_SECRET: 'e2e-test-session-secret-not-for-production-12345',
			API_KEY_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString('base64'),
			DATABASE_PATH: join(dataDirectory, 'accounts.sqlite')
		}
	}
});
