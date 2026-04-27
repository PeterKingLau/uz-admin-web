const DEVICE_ID_STORAGE_KEY = 'uz:device:id'
const DEVICE_USER_BINDING_KEY = 'uz:device:user:binding'

const isClient = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined'

function createFallbackDeviceId() {
    const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    return `web-${seed}`
}

function createDeviceId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return createFallbackDeviceId()
}

export function getOrCreateDeviceId() {
    if (!isClient()) return createFallbackDeviceId()
    const cached = String(localStorage.getItem(DEVICE_ID_STORAGE_KEY) || '').trim()
    if (cached) return cached
    const nextId = createDeviceId()
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, nextId)
    return nextId
}

export function bindDeviceToUser(userId?: string | number | null) {
    if (!isClient()) return
    const normalizedUserId = String(userId ?? '').trim()
    if (!normalizedUserId) return
    const deviceId = getOrCreateDeviceId()
    const nextPayload = {
        userId: normalizedUserId,
        deviceId,
        updatedAt: Date.now()
    }
    localStorage.setItem(DEVICE_USER_BINDING_KEY, JSON.stringify(nextPayload))
}

export function getDeviceIdHeader() {
    return {
        'X-Device-Id': getOrCreateDeviceId()
    }
}
