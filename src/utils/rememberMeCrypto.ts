const CRYPTO_VERSION = 'wc2'
const LEGACY_CRYPTO_VERSION = 'wc1'
const FALLBACK_CRYPTO_VERSION = 'wc0'
const PBKDF2_ITERATIONS = 120000
const KEY_LENGTH = 256
const SALT_LENGTH = 16
const IV_LENGTH = 12
const encoder = new TextEncoder()
const decoder = new TextDecoder()

function hasWebCryptoSupport(): boolean {
    return Boolean(globalThis.crypto?.subtle)
}

function ensureCryptoSupport(): Crypto {
    if (!hasWebCryptoSupport()) {
        throw new Error('Web Crypto API is not available')
    }
    return globalThis.crypto
}

function normalizeBase64(value: string): string {
    return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function restoreBase64(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padding = normalized.length % 4
    if (!padding) return normalized
    return normalized + '='.repeat(4 - padding)
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = ''
    bytes.forEach(byte => {
        binary += String.fromCharCode(byte)
    })
    return normalizeBase64(btoa(binary))
}

function base64ToBytes(value: string): Uint8Array {
    const binary = atob(restoreBase64(value))
    return Uint8Array.from(binary, char => char.charCodeAt(0))
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const copy = new Uint8Array(bytes.byteLength)
    copy.set(bytes)
    return copy.buffer
}

function getKeyMaterialSeed(version: string): string {
    const appName = String(import.meta.env.VITE_APP_TITLE || 'uz-web').trim()
    const origin = globalThis.location?.origin || 'unknown-origin'
    if (version === LEGACY_CRYPTO_VERSION) {
        const userAgent = globalThis.navigator?.userAgent || 'unknown-user-agent'
        return [LEGACY_CRYPTO_VERSION, appName, origin, userAgent, 'remember-me'].join('|')
    }
    return [version, appName, origin, 'remember-me'].join('|')
}

async function deriveKey(salt: Uint8Array, version = CRYPTO_VERSION): Promise<CryptoKey> {
    const cryptoApi = ensureCryptoSupport()
    const baseKey = await cryptoApi.subtle.importKey('raw', encoder.encode(getKeyMaterialSeed(version)), 'PBKDF2', false, ['deriveKey'])
    return cryptoApi.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: toArrayBuffer(salt),
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        baseKey,
        {
            name: 'AES-GCM',
            length: KEY_LENGTH
        },
        false,
        ['encrypt', 'decrypt']
    )
}

function createFallbackKey(length: number): Uint8Array {
    const seed = encoder.encode(getKeyMaterialSeed(FALLBACK_CRYPTO_VERSION))
    let state = 0x811c9dc5
    seed.forEach(byte => {
        state = Math.imul(state ^ byte, 0x01000193) >>> 0
    })

    const output = new Uint8Array(length)
    for (let index = 0; index < length; index++) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0
        output[index] = state & 0xff
    }
    return output
}

function xorCipher(bytes: Uint8Array): Uint8Array {
    const key = createFallbackKey(bytes.length)
    const output = new Uint8Array(bytes.length)
    for (let index = 0; index < bytes.length; index++) {
        output[index] = bytes[index] ^ key[index]
    }
    return output
}

function encryptRememberedPasswordFallback(plainText: string): string {
    const bytes = encoder.encode(String(plainText || ''))
    return [FALLBACK_CRYPTO_VERSION, bytesToBase64(xorCipher(bytes))].join('.')
}

function decryptRememberedPasswordFallback(payload: string): string {
    const [version, cipherText] = String(payload || '').split('.')
    if (version !== FALLBACK_CRYPTO_VERSION || !cipherText) {
        throw new Error('Invalid remember-me payload')
    }

    return decoder.decode(xorCipher(base64ToBytes(cipherText)))
}

async function encryptRememberedPasswordWithWebCrypto(plainText: string): Promise<string> {
    const cryptoApi = ensureCryptoSupport()
    const salt = cryptoApi.getRandomValues(new Uint8Array(SALT_LENGTH))
    const iv = cryptoApi.getRandomValues(new Uint8Array(IV_LENGTH))
    const key = await deriveKey(salt)
    const cipherBuffer = await cryptoApi.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: toArrayBuffer(iv)
        },
        key,
        encoder.encode(String(plainText || ''))
    )

    return [CRYPTO_VERSION, bytesToBase64(salt), bytesToBase64(iv), bytesToBase64(new Uint8Array(cipherBuffer))].join('.')
}

async function decryptRememberedPasswordWithWebCrypto(payload: string, version: string): Promise<string> {
    const [, saltText, ivText, cipherText] = String(payload || '').split('.')
    if (!saltText || !ivText || !cipherText) {
        throw new Error('Invalid remember-me payload')
    }

    const key = await deriveKey(base64ToBytes(saltText), version)
    const plainBuffer = await ensureCryptoSupport().subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: toArrayBuffer(base64ToBytes(ivText))
        },
        key,
        toArrayBuffer(base64ToBytes(cipherText))
    )

    return decoder.decode(plainBuffer)
}

export async function encryptRememberedPassword(plainText: string): Promise<string> {
    if (!hasWebCryptoSupport()) {
        return encryptRememberedPasswordFallback(plainText)
    }
    return encryptRememberedPasswordWithWebCrypto(plainText)
}

export async function decryptRememberedPassword(payload: string): Promise<string> {
    const [version] = String(payload || '').split('.')

    if (version === FALLBACK_CRYPTO_VERSION) {
        return decryptRememberedPasswordFallback(payload)
    }

    if (version === CRYPTO_VERSION || version === LEGACY_CRYPTO_VERSION) {
        return decryptRememberedPasswordWithWebCrypto(payload, version)
    }

    throw new Error('Invalid remember-me payload')
}
