import type { RouteLocationRaw } from 'vue-router'

type UserIdentity = {
    id?: string | number | null
    roles?: string[]
    admin?: boolean
}

const MANAGEMENT_ROLE_KEYS = ['admin', 'super_admin', 'manager', 'operator']
const CLIENT_PROFILE_UUID_MARKER = 0x75
const CLIENT_PROFILE_ID_MASK = [0x13, 0x57, 0x9b, 0xdf, 0x24, 0x68, 0xac, 0xe0, 0x35, 0x79, 0xbd, 0xf1, 0x46, 0x8a]

export const CLIENT_ROUTE_PREFIXES = [
    '/discover',
    '/publish',
    '/profile',
    '/content/userProfile',
    '/content/personProfile',
    '/content/person-profile',
    '/content/profile',
    '/content/video-player',
    '/circle-manage/circle-data'
]

export function normalizeRoleKeys(roles: string[] = []): string[] {
    return roles
        .map(role =>
            String(role || '')
                .trim()
                .toLowerCase()
        )
        .filter(Boolean)
}

export function hasManagementRole(roles: string[] = []): boolean {
    const roleKeys = normalizeRoleKeys(roles)
    return roleKeys.some(role => MANAGEMENT_ROLE_KEYS.includes(role))
}

export function isCommonClientIdentity(identity?: UserIdentity | null): boolean {
    const roleKeys = normalizeRoleKeys(identity?.roles || [])
    const isCommon = roleKeys.includes('common')
    const isAdminRole = Boolean(identity?.admin) || hasManagementRole(identity?.roles || [])
    return isCommon && !isAdminRole
}

export function hasClientEntryPermission(identity?: UserIdentity | null): boolean {
    const roleKeys = normalizeRoleKeys(identity?.roles || [])
    if (Boolean(identity?.admin) || hasManagementRole(identity?.roles || [])) return true
    if (!roleKeys.length) return false
    if (roleKeys.includes('common')) return false
    return true
}

export function isClientRoutePath(path?: string | null): boolean {
    const value = String(path || '').trim()
    if (!value) return false
    return CLIENT_ROUTE_PREFIXES.some(prefix => value === prefix || value.startsWith(`${prefix}/`) || value.startsWith(`${prefix}?`))
}

export function getClientHomeRoute(): RouteLocationRaw {
    return { path: '/discover' }
}

export function getClientBaseUrl(): string {
    return String(import.meta.env.VITE_CLIENT_BASE_URL || '').trim()
}

export function getAdminHomeRoute(): RouteLocationRaw {
    return { path: '/index' }
}

export function getClientSelfProfileRoute(userId?: string | number | null): RouteLocationRaw {
    const normalizedUserId = String(userId ?? '').trim()
    if (!normalizedUserId) return { path: '/profile' }
    return {
        path: '/profile'
    }
}

export function encodeClientUserId(userId?: string | number | null): string {
    const normalizedUserId = String(userId ?? '').trim()
    if (!normalizedUserId) return ''
    const bytes = new TextEncoder().encode(normalizedUserId)
    if (bytes.length > CLIENT_PROFILE_ID_MASK.length) {
        throw new Error('Client user id is too long to encode as a profile UUID route parameter')
    }

    const uuidBytes = new Uint8Array(16)
    uuidBytes[0] = CLIENT_PROFILE_UUID_MARKER
    uuidBytes[1] = bytes.length
    bytes.forEach((byte, index) => {
        uuidBytes[index + 2] = byte ^ CLIENT_PROFILE_ID_MASK[index]
    })
    for (let index = bytes.length + 2; index < uuidBytes.length; index += 1) {
        uuidBytes[index] = (CLIENT_PROFILE_ID_MASK[(index - 2) % CLIENT_PROFILE_ID_MASK.length] + index * 17) & 0xff
    }
    const hex = Array.from(uuidBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function decodeClientUserId(encodedUserId?: string | number | null): string {
    const text = String(encodedUserId ?? '').trim()
    if (!text) return ''
    const uuidText = text.replace(/-/g, '')
    if (/^[0-9a-fA-F]{32}$/.test(uuidText)) {
        const bytes = new Uint8Array(uuidText.match(/.{2}/g)?.map(hex => parseInt(hex, 16)) || [])
        const length = bytes[1]
        if (bytes[0] === CLIENT_PROFILE_UUID_MARKER && length <= CLIENT_PROFILE_ID_MASK.length && length <= bytes.length - 2) {
            const payload = bytes.slice(2, 2 + length).map((byte, index) => byte ^ CLIENT_PROFILE_ID_MASK[index])
            return new TextDecoder().decode(payload)
        }
    }
    return ''
}

export function getClientUserProfileRoute(userId?: string | number | null): RouteLocationRaw {
    const normalizedUserId = String(userId ?? '').trim()
    if (!normalizedUserId) return getClientSelfProfileRoute()
    return {
        name: 'ClientUserProfile',
        params: { userId: encodeClientUserId(normalizedUserId) }
    }
}

export function resolvePersonalRoute(identity: UserIdentity | null | undefined, entry: 'home' | 'profile' | 'password'): RouteLocationRaw | null {
    const isClient = isCommonClientIdentity(identity)
    if (!isClient) {
        if (entry === 'password') {
            return { name: 'Profile', query: { activeTab: 'resetPwd' } }
        }
        return { name: 'Profile' }
    }

    if (entry === 'password') return null
    return getClientSelfProfileRoute(identity?.id)
}
