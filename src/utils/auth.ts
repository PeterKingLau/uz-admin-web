import Cookies from 'js-cookie'

const TokenKey = 'Admin-Token'

export function getToken() {
    return Cookies.get(TokenKey)
}

export function setToken(token: string) {
    const normalized = typeof token === 'string' ? token.trim() : ''
    if (!normalized || normalized === 'undefined' || normalized === 'null') {
        return Cookies.remove(TokenKey)
    }
    return Cookies.set(TokenKey, normalized)
}

export function removeToken() {
    return Cookies.remove(TokenKey)
}
