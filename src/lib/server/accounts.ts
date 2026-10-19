import Database from 'better-sqlite3';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { env } from '$env/dynamic/private';
import { encryptSecret, decryptSecret, parseEncryptionKey } from './crypto';
import type { KeyStatus, Preferences, Provider } from '$lib/account';

export function createAccountRepository(db: Database.Database, encryptionKey: () => Buffer) {
	db.pragma('journal_mode = WAL');
	db.pragma('busy_timeout = 5000');
	db.exec(`
		CREATE TABLE IF NOT EXISTS preferences (
			user_id TEXT NOT NULL,
			name TEXT NOT NULL,
			value TEXT NOT NULL,
			PRIMARY KEY (user_id, name)
		);
		CREATE TABLE IF NOT EXISTS api_keys (
			user_id TEXT NOT NULL,
			provider TEXT NOT NULL,
			encrypted_value TEXT NOT NULL,
			hint TEXT NOT NULL,
			updated_at INTEGER NOT NULL,
			PRIMARY KEY (user_id, provider)
		);
	`);
	return {
		getPreferences(userId: string): Preferences {
			const rows = db
				.prepare('SELECT name, value FROM preferences WHERE user_id = ?')
				.all(userId) as { name: string; value: string }[];
			return Object.fromEntries(rows.map((row) => [row.name, JSON.parse(row.value)]));
		},
		patchPreferences(userId: string, patch: Preferences) {
			db.transaction(() => {
				for (const [name, value] of Object.entries(patch)) {
					if (value === null)
						db.prepare('DELETE FROM preferences WHERE user_id = ? AND name = ?').run(userId, name);
					else
						db.prepare(
							'INSERT INTO preferences VALUES (?, ?, ?) ON CONFLICT(user_id, name) DO UPDATE SET value = excluded.value'
						).run(userId, name, JSON.stringify(value));
				}
			})();
		},
		listKeys(userId: string): KeyStatus[] {
			return db
				.prepare(
					'SELECT provider, hint, updated_at AS updatedAt FROM api_keys WHERE user_id = ? ORDER BY provider'
				)
				.all(userId) as KeyStatus[];
		},
		saveKey(userId: string, provider: Provider, value: string) {
			const encrypted = encryptSecret(value, encryptionKey(), `${userId}:${provider}`);
			db.prepare(
				`INSERT INTO api_keys VALUES (?, ?, ?, ?, ?)
				ON CONFLICT(user_id, provider) DO UPDATE SET encrypted_value = excluded.encrypted_value, hint = excluded.hint, updated_at = excluded.updated_at`
			).run(userId, provider, encrypted, `••••${value.slice(-4)}`, Date.now());
		},
		getKey(userId: string, provider: Provider): string | null {
			const row = db
				.prepare('SELECT encrypted_value FROM api_keys WHERE user_id = ? AND provider = ?')
				.get(userId, provider) as { encrypted_value: string } | undefined;
			return row
				? decryptSecret(row.encrypted_value, encryptionKey(), `${userId}:${provider}`)
				: null;
		},
		deleteKey(userId: string, provider: Provider) {
			db.prepare('DELETE FROM api_keys WHERE user_id = ? AND provider = ?').run(userId, provider);
		}
	};
}

let repository: ReturnType<typeof createAccountRepository> | undefined;
export function accounts() {
	if (!repository) {
		const path = resolve(env.DATABASE_PATH || 'data/situation-monitor.sqlite');
		mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
		const db = new Database(path);
		chmodSync(path, 0o600);
		repository = createAccountRepository(db, () => parseEncryptionKey(env.API_KEY_ENCRYPTION_KEY));
	}
	return repository;
}
