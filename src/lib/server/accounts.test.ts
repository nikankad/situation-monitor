// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAccountRepository } from './accounts';
import { decryptSecret, encryptSecret, parseEncryptionKey } from './crypto';
import { preferencesSchema, readJson } from './validation';

const directory = mkdtempSync(join(tmpdir(), 'situation-account-'));
const databases: Database.Database[] = [];
const key = Buffer.alloc(32, 7);
afterEach(() => {
	databases.splice(0).forEach((db) => db.close());
});

function repository(path = ':memory:') {
	const db = new Database(path);
	databases.push(db);
	return { db, account: createAccountRepository(db, () => key) };
}

describe('private account data', () => {
	it('persists encrypted keys and preferences across database connections', () => {
		const path = join(directory, 'persistent.sqlite');
		try {
			const first = repository(path);
			first.account.saveKey('alice', 'finnhub', 'private-alice-key');
			first.account.patchPreferences('alice', { panelOrder: ['map', 'markets'] });
			const stored = first.db.prepare('SELECT encrypted_value FROM api_keys').get() as {
				encrypted_value: string;
			};
			expect(stored.encrypted_value).not.toContain('private-alice-key');
			first.db.close();
			databases.pop();
			const second = repository(path);
			expect(second.account.getKey('alice', 'finnhub')).toBe('private-alice-key');
			expect(second.account.getPreferences('alice')).toEqual({ panelOrder: ['map', 'markets'] });
		} finally {
			/* afterEach closes the last connection. */
		}
	});

	it('isolates read, replacement and deletion by account and provider', () => {
		const { account } = repository();
		account.saveKey('alice', 'finnhub', 'alice-finnhub-secret');
		account.saveKey('alice', 'fred', 'alice-fred-secret');
		account.saveKey('bob', 'finnhub', 'bob-finnhub-secret');
		account.saveKey('alice', 'finnhub', 'replacement-secret');
		account.deleteKey('alice', 'finnhub');
		expect(account.getKey('alice', 'finnhub')).toBeNull();
		expect(account.getKey('alice', 'fred')).toBe('alice-fred-secret');
		expect(account.getKey('bob', 'finnhub')).toBe('bob-finnhub-secret');
		expect(JSON.stringify(account.listKeys('alice'))).not.toContain('alice-fred-secret');
		expect(account.listKeys('charlie')).toEqual([]);
	});

	it('merges preference groups and does not leak them between accounts', () => {
		const { account } = repository();
		account.patchPreferences('alice', {
			panelOrder: ['map'],
			customMarkets: [{ symbol: 'AAPL', name: 'Apple' }]
		});
		account.patchPreferences('alice', { panelOrder: ['markets'] });
		account.patchPreferences('bob', { panelOrder: ['politics'] });
		expect(account.getPreferences('alice').customMarkets).toEqual([
			{ symbol: 'AAPL', name: 'Apple' }
		]);
		account.patchPreferences('alice', { panelOrder: null });
		expect(account.getPreferences('alice').panelOrder).toBeUndefined();
		expect(account.getPreferences('bob')).toEqual({ panelOrder: ['politics'] });
	});
});

describe('credential encryption and validation', () => {
	it('uses random nonces and rejects a swapped account, provider, or encryption key', () => {
		const encrypted = encryptSecret('secret', key, 'alice:finnhub');
		expect(encryptSecret('secret', key, 'alice:finnhub')).not.toBe(encrypted);
		expect(decryptSecret(encrypted, key, 'alice:finnhub')).toBe('secret');
		expect(() => decryptSecret(encrypted, key, 'bob:finnhub')).toThrow();
		expect(() => decryptSecret(encrypted, key, 'alice:fred')).toThrow();
		expect(() => decryptSecret(encrypted, Buffer.alloc(32, 8), 'alice:finnhub')).toThrow();
	});
	it('requires a valid server encryption key', () => {
		expect(parseEncryptionKey(key.toString('base64'))).toEqual(key);
		for (const value of [undefined, '', 'weak-key', Buffer.alloc(16).toString('base64')]) {
			expect(() => parseEncryptionKey(value)).toThrow();
		}
	});
	it('rejects unknown fields, invalid panel IDs and duplicates', () => {
		expect(preferencesSchema.safeParse({ userId: 'bob', panelOrder: ['map'] }).success).toBe(false);
		expect(preferencesSchema.safeParse({ panelOrder: ['not-a-panel'] }).success).toBe(false);
		expect(preferencesSchema.safeParse({ panelOrder: ['map', 'map'] }).success).toBe(false);
		expect(preferencesSchema.safeParse({ panelOrder: ['map', 'markets'] }).success).toBe(true);
	});
	it('rejects oversized JSON bodies and incorrect content types', async () => {
		const oversized = new Request('http://localhost', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: 'x'.repeat(65537)
		});
		await expect(readJson(oversized, preferencesSchema)).rejects.toMatchObject({ status: 413 });
		const incorrect = new Request('http://localhost', { method: 'PATCH', body: '{}' });
		await expect(readJson(incorrect, preferencesSchema)).rejects.toMatchObject({ status: 415 });
	});
});

import { afterAll } from 'vitest';
afterAll(() => rmSync(directory, { recursive: true, force: true }));
