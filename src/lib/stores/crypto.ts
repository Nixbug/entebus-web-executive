/**
 * AES-GCM encryption helpers for token storage.
 *
 * Key is generated once and persisted as a non-exportable CryptoKey in IndexedDB.
 * This protects stored tokens from casual inspection (DevTools → Storage) and
 * offline disk access, but does NOT protect against XSS — same-origin JS can
 * still call these functions and decrypt. For true XSS protection, use HttpOnly
 * cookies set by the server.
 */

const DB_NAME = 'entebus-keystore';
const DB_STORE = 'keys';
const KEY_ID = 'token-key';

//-- open (or create) the IndexedDB database for key storage --
function openKeyStore(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			req.result.createObjectStore(DB_STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

//-- persist the CryptoKey in IndexedDB --
async function saveKey(key: CryptoKey): Promise<void> {
	const db = await openKeyStore();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(DB_STORE, 'readwrite');
		tx.objectStore(DB_STORE).put(key, KEY_ID);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

//-- load the CryptoKey from IndexedDB --
async function loadKey(): Promise<CryptoKey | null> {
	const db = await openKeyStore();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(DB_STORE, 'readonly');
		const req = tx.objectStore(DB_STORE).get(KEY_ID);
		req.onsuccess = () => resolve(req.result ?? null);
		req.onerror = () => reject(req.error);
	});
}

//-- get existing key or generate a new one --
async function getOrCreateKey(): Promise<CryptoKey> {
	const existing = await loadKey();
	if (existing) return existing;

	const key = await crypto.subtle.generateKey(
		{ name: 'AES-GCM', length: 256 },
		false, // non-exportable
		['encrypt', 'decrypt']
	);
	await saveKey(key);
	return key;
}

//-- cached key promise so we only hit IndexedDB once per session --
let _keyPromise: Promise<CryptoKey> | null = null;

function getCachedKey(): Promise<CryptoKey> {
	if (!_keyPromise) {
		_keyPromise = getOrCreateKey();
	}
	return _keyPromise;
}

/**
 * Encrypt a plaintext string with AES-GCM.
 * Returns a base64 string containing the IV (12 bytes) + ciphertext.
 */
export async function encrypt(plaintext: string): Promise<string> {
	const key = await getCachedKey();
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encoded = new TextEncoder().encode(plaintext);
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

	// combine IV + ciphertext into one buffer
	const combined = new Uint8Array(iv.length + ciphertext.byteLength);
	combined.set(iv, 0);
	combined.set(new Uint8Array(ciphertext), iv.length);

	return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64 string produced by `encrypt()`.
 * Returns the original plaintext string, or null if decryption fails.
 */
export async function decrypt(encoded: string): Promise<string | null> {
	try {
		const key = await getCachedKey();
		const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
		const iv = combined.slice(0, 12);
		const ciphertext = combined.slice(12);

		const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
		return new TextDecoder().decode(decrypted);
	} catch {
		return null;
	}
}
