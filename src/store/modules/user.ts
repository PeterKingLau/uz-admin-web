import { defineStore } from 'pinia'
import router from '@/router'
import { ElMessageBox } from 'element-plus'
import { login, logout, getInfo } from '@/api/login/login'
import { getUserProfile } from '@/api/system/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { isHttp } from '@/utils/validate'
import { getImgUrl } from '@/utils/img'
import defAva from '@/assets/images/profile.jpg'

export enum LoginType {
    PASSWORD = 'PASSWORD',
    SMS = 'SMS'
}

interface UserState {
    token: string | null | undefined
    id: string
    name: string
    nickName: string
    avatar: string
    admin: boolean
    roles: string[]
    permissions: string[]
    profileLoadedAt: number
}

interface LoginPayload {
    loginType: LoginType
    username: string
    password?: string
    smsCode?: string
}

const PROFILE_REFRESH_TTL = 2 * 60 * 1000
let profileRefreshPromise: Promise<any> | null = null

function normalizeTokenValue(token: unknown): string {
    if (typeof token !== 'string') return ''
    let normalized = token.trim()
    if (!normalized || normalized === 'undefined' || normalized === 'null') return ''
    normalized = normalized.replace(/^Bearer\s+/i, '').trim()
    return normalized
}

function extractLoginToken(response: any): string {
    const candidates = [
        response?.token,
        response?.accessToken,
        response?.access_token,
        response?.data?.token,
        response?.data?.accessToken,
        response?.data?.access_token
    ]
    for (const candidate of candidates) {
        const token = normalizeTokenValue(candidate)
        if (token) return token
    }
    return ''
}

function normalizeAvatarValue(avatar: unknown): string {
    const raw = String(avatar || '').trim()
    if (!raw) return defAva
    if (isHttp(raw) || raw.startsWith('//') || raw.startsWith('data:') || raw.startsWith('blob:')) return raw
    return getImgUrl(raw)
}

function normalizeUserSnapshot(user: Record<string, any> | null | undefined) {
    const source = user || {}
    const resolvedId = source.userId ?? source.id ?? ''
    const resolvedName = source.userName ?? source.username ?? source.name ?? ''
    const resolvedNickName = source.nickName ?? source.nickname ?? resolvedName ?? ''

    return {
        id: String(resolvedId || ''),
        name: String(resolvedName || ''),
        nickName: String(resolvedNickName || ''),
        avatar: normalizeAvatarValue(source.avatar)
    }
}

const useUserStore = defineStore('user', {
    state: (): UserState => ({
        token: getToken(),
        id: '',
        name: '',
        nickName: '',
        avatar: defAva,
        admin: false,
        roles: [],
        permissions: [],
        profileLoadedAt: 0
    }),

    actions: {
        resetUserSnapshot() {
            this.id = ''
            this.name = ''
            this.nickName = ''
            this.avatar = defAva
            this.admin = false
            this.roles = []
            this.permissions = []
            this.profileLoadedAt = 0
        },

        applyUserSnapshot(user: Record<string, any> | null | undefined, auth?: { roles?: string[]; permissions?: string[] }) {
            const snapshot = normalizeUserSnapshot(user)
            this.id = snapshot.id
            this.name = snapshot.name
            this.nickName = snapshot.nickName
            this.avatar = snapshot.avatar
            const roleAdmin = Array.isArray(user?.roles) ? user.roles.some((role: any) => role?.admin === true) : false
            this.admin = Boolean((user?.admin === true || user?.isAdmin === true || roleAdmin) ?? false)

            if (auth) {
                if (Array.isArray(auth.roles) && auth.roles.length > 0) {
                    this.roles = auth.roles
                    this.permissions = Array.isArray(auth.permissions) ? auth.permissions : []
                } else if (Array.isArray(auth.roles)) {
                    this.roles = ['ROLE_DEFAULT']
                    this.permissions = []
                }
            }

            this.profileLoadedAt = Date.now()
        },

        patchUserSnapshot(user: Record<string, any> | null | undefined) {
            if (!user) return
            this.applyUserSnapshot(
                {
                    userId: user.userId ?? user.id ?? this.id,
                    userName: user.userName ?? user.username ?? user.name ?? this.name,
                    nickName: user.nickName ?? user.nickname ?? this.nickName ?? this.name,
                    avatar: user.avatar ?? this.avatar,
                    admin: user.admin ?? user.isAdmin ?? this.admin
                },
                {
                    roles: this.roles,
                    permissions: this.permissions
                }
            )
        },

        login(userInfo: LoginPayload): Promise<any> {
            const username = (userInfo.username || '').trim()
            const payload: LoginPayload = {
                loginType: userInfo.loginType || LoginType.PASSWORD,
                username
            }

            if (userInfo.password) payload.password = userInfo.password
            if (userInfo.smsCode) payload.smsCode = userInfo.smsCode

            return new Promise((resolve, reject) => {
                login(payload)
                    .then(res => {
                        const token = extractLoginToken(res)
                        if (!token) {
                            removeToken()
                            reject(new Error('登录成功，但未获取到有效 token，请检查后端登录返回字段'))
                            return
                        }
                        setToken(token)
                        this.token = token
                        this.resetUserSnapshot()
                        resolve(res)
                    })
                    .catch(err => reject(err))
            })
        },

        getInfo(): Promise<any> {
            return new Promise((resolve, reject) => {
                getInfo()
                    .then(res => {
                        this.applyUserSnapshot(res.user, {
                            roles: res.roles,
                            permissions: res.permissions
                        })

                        if (res.isDefaultModifyPwd) {
                            ElMessageBox.confirm('您的密码还是初始密码，请尽快修改密码！', '安全提示', {
                                confirmButtonText: '确定',
                                cancelButtonText: '取消',
                                type: 'warning'
                            })
                                .then(() => {
                                    router.push({
                                        name: 'Profile',
                                        params: { activeTab: 'resetPwd' }
                                    })
                                })
                                .catch(() => {})
                        }

                        if (!res.isDefaultModifyPwd && res.isPasswordExpired) {
                            ElMessageBox.confirm('您的密码已过期，请尽快修改密码！', '安全提示', {
                                confirmButtonText: '确定',
                                cancelButtonText: '取消',
                                type: 'warning'
                            })
                                .then(() => {
                                    router.push({
                                        name: 'Profile',
                                        params: { activeTab: 'resetPwd' }
                                    })
                                })
                                .catch(() => {})
                        }

                        resolve(res)
                    })
                    .catch(error => {
                        reject(error)
                    })
            })
        },

        refreshProfile(): Promise<any> {
            if (profileRefreshPromise) return profileRefreshPromise

            profileRefreshPromise = new Promise((resolve, reject) => {
                getUserProfile()
                    .then(res => {
                        this.patchUserSnapshot(res?.data)
                        resolve(res)
                    })
                    .catch(error => reject(error))
                    .finally(() => {
                        profileRefreshPromise = null
                    })
            })

            return profileRefreshPromise
        },

        ensureFreshProfile(force = false): Promise<any> {
            if (!this.token) return Promise.resolve(null)
            const now = Date.now()
            const shouldRefresh = force || !this.profileLoadedAt || now - this.profileLoadedAt >= PROFILE_REFRESH_TTL
            if (!shouldRefresh) return Promise.resolve(null)
            return this.refreshProfile()
        },

        logOut(callLogoutApi = true): Promise<void> {
            const clearLocalAuth = () => {
                this.token = ''
                this.resetUserSnapshot()
                removeToken()
            }

            if (!callLogoutApi) {
                clearLocalAuth()
                return Promise.resolve()
            }

            return new Promise(resolve => {
                logout()
                    .catch(() => {
                        // Token 已失效时，后端可能返回 401，本地状态仍需清理。
                    })
                    .finally(() => {
                        clearLocalAuth()
                        resolve()
                    })
            })
        }
    }
})

export default useUserStore
