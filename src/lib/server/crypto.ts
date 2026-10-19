import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export function parseEncryptionKey(value: string | undefined): Buffer {
	if (!value || !/^[A-Za-z0-9+/]{43}=$/.test(value)) {
		throw new Error('API_KEY_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
	}
	const key = Buffer.from(value, 'base64');
	if (key.length !== 32) throw new Error('Invalid API key encryption key');
	return key;
}

export function encryptSecret(secret: string, key: Buffer, context: string): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key, iv);
	cipher.setAAD(Buffer.from(context));
	const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
	return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64')).join('.');
}

export function decryptSecret(encrypted: string, key: Buffer, context: string): string {
	const [iv, tag, ciphertext] = encrypted.split('.').map((part) => Buffer.from(part, 'base64'));
	const decipher = createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAAD(Buffer.from(context));
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
