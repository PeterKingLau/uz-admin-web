import { defineStore } from 'pinia'
import router from '@/router'
import { ElMessageBox } from 'element-plus'
import { login, logout, getInfo } from '@/api/login/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { isHttp, isEmpty } from '@/utils/validate'
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
    roles: string[]
    permissions: string[]
}

interface LoginPayload {
    loginType: LoginType
    username: string
    password?: string
    smsCode?: string
}

function normalizeTokenValue(token: unknown): string {
    if (typeof token !== 'string') return ''
    let normalized = token.trim()
    if (!normalized || normalized === 'undefined' || normalized === 'null') return ''
    normalized = normalized.replace(/^Bearer\s+/i, '').trim()
    return normalized
}

function extractLoginToken(response: any): string {
    const candidates = [response?.token, response?.accessToken, response?.access_token, response?.data?.token, response?.data?.accessToken, response?.data?.access_token]
    for (const candidate of candidates) {
        const token = normalizeTokenValue(candidate)
        if (token) return token
    }
    return ''
}

const useUserStore = defineStore('user', {
    state: (): UserState => ({
        token: getToken(),
        id: '',
        name: '',
        nickName: '',
        avatar: '',
        roles: [],
        permissions: []
    }),

    actions: {
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
                        resolve(res)
                    })
                    .catch(err => reject(err))
            })
        },

        getInfo(): Promise<any> {
            return new Promise((resolve, reject) => {
                getInfo()
                    .then(res => {
                        const user = res.user
                        let avatar = user.avatar || ''
                        if (!isHttp(avatar)) {
                            avatar = isEmpty(avatar) ? defAva : getImgUrl(avatar)
                        }

                        if (res.roles && res.roles.length > 0) {
                            this.roles = res.roles
                            this.permissions = res.permissions || []
                        } else {
                            this.roles = ['ROLE_DEFAULT']
                            this.permissions = []
                        }

                        this.id = user.userId
                        this.name = user.userName
                        this.nickName = user.nickName
                        this.avatar = avatar

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

        logOut(callLogoutApi = true): Promise<void> {
            const clearLocalAuth = () => {
                this.token = ''
                this.roles = []
                this.permissions = []
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
