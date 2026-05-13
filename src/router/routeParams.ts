const ROUTE_ID_UUID_MARKER = 0x72
const ROUTE_ID_NUMERIC_FLAG = 0x80
const ROUTE_ID_MASK = [0x29, 0x6d, 0xb1, 0xf5, 0x3a, 0x7e, 0xc2, 0x06, 0x4b, 0x8f, 0xd3, 0x17, 0x5c, 0xa0]
const UUID_TEXT_PATTERN = /^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$/

function normalizeRouteParam(value: unknown): string {
    const raw = Array.isArray(value) ? value[0] : value
    return String(raw ?? '').trim()
}

function toUuidText(bytes: Uint8Array): string {
    const hex = Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function parseUuidBytes(value: string): Uint8Array | null {
    if (!UUID_TEXT_PATTERN.test(value)) return null
    const hex = value.replace(/-/g, '')
    return new Uint8Array(hex.match(/.{2}/g)?.map(item => parseInt(item, 16)) || [])
}

function numericTextToBytes(value: string): Uint8Array {
    let numericValue = value.replace(/^0+/, '') || '0'
    if (numericValue === '0') return new Uint8Array([0])

    const bytes: number[] = []
    while (numericValue !== '0') {
        let quotient = ''
        let remainder = 0

        for (let index = 0; index < numericValue.length; index += 1) {
            const nextValue = remainder * 10 + Number(numericValue[index])
            const nextDigit = Math.floor(nextValue / 256)
            remainder = nextValue % 256
            if (quotient || nextDigit > 0) {
                quotient += String(nextDigit)
            }
        }

        bytes.unshift(remainder)
        numericValue = quotient || '0'
    }

    return new Uint8Array(bytes)
}

function bytesToNumericText(bytes: Uint8Array): string {
    let value = '0'

    bytes.forEach(byte => {
        let carry = byte
        let nextValue = ''

        for (let index = value.length - 1; index >= 0; index -= 1) {
            const nextDigit = Number(value[index]) * 256 + carry
            nextValue = String(nextDigit % 10) + nextValue
            carry = Math.floor(nextDigit / 10)
        }

        while (carry > 0) {
            nextValue = String(carry % 10) + nextValue
            carry = Math.floor(carry / 10)
        }

        value = nextValue.replace(/^0+/, '') || '0'
    })

    return value
}

export function isEncodedRouteId(value: unknown): boolean {
    const bytes = parseUuidBytes(normalizeRouteParam(value))
    if (!bytes || bytes.length !== 16) return false
    const length = bytes[1] & ~ROUTE_ID_NUMERIC_FLAG
    return bytes[0] === ROUTE_ID_UUID_MARKER && length <= ROUTE_ID_MASK.length && length <= bytes.length - 2
}

export function encodeRouteId(value: unknown): string {
    const text = normalizeRouteParam(value)
    if (!text || isEncodedRouteId(text)) return text

    const isNumeric = /^\d+$/.test(text)
    const payload = isNumeric ? numericTextToBytes(text) : new TextEncoder().encode(text)
    if (payload.length > ROUTE_ID_MASK.length) return text

    const bytes = new Uint8Array(16)
    bytes[0] = ROUTE_ID_UUID_MARKER
    bytes[1] = payload.length | (isNumeric ? ROUTE_ID_NUMERIC_FLAG : 0)
    payload.forEach((byte, index) => {
        bytes[index + 2] = byte ^ ROUTE_ID_MASK[index]
    })
    for (let index = payload.length + 2; index < bytes.length; index += 1) {
        bytes[index] = (ROUTE_ID_MASK[(index - 2) % ROUTE_ID_MASK.length] + index * 19) & 0xff
    }

    return toUuidText(bytes)
}

export function decodeRouteId(value: unknown): string {
    const text = normalizeRouteParam(value)
    if (!text) return ''

    const bytes = parseUuidBytes(text)
    if (!bytes || bytes.length !== 16) return text

    const isNumeric = Boolean(bytes[1] & ROUTE_ID_NUMERIC_FLAG)
    const length = bytes[1] & ~ROUTE_ID_NUMERIC_FLAG
    if (bytes[0] !== ROUTE_ID_UUID_MARKER || length > ROUTE_ID_MASK.length || length > bytes.length - 2) {
        return text
    }

    const payload = bytes.slice(2, 2 + length).map((byte, index) => byte ^ ROUTE_ID_MASK[index])
    return isNumeric ? bytesToNumericText(payload) : new TextDecoder().decode(payload)
}
