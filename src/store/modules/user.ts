import { defineStore } from 'pinia'
import router from '@/router'
import { ElMessageBox } from 'element-plus'
import { login, logout, getInfo } from '@/api/login/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { isHttp, isEmpty } from '@/utils/validate'
import { getImgUrl } from '@/utils/img'
import defAva from '@/assets/images/profile.jpg'

// 定义 LoginType 枚举
export enum LoginType {
    PASSWORD = 'PASSWORD',
    SMS = 'SMS'
}

// 定义 UserState 类型，描述 state 的结构
interface UserState {
    token: string | null | undefined
    id: string
    name: string
    nickName: string
    avatar: string
    roles: string[]
    permissions: string[]
}

// 定义 login 方法的参数类型
interface LoginPayload {
    loginType: LoginType // 使用 LoginType 枚举
    username: string
    password?: string
    smsCode?: string
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
        // 登录
        login(userInfo: LoginPayload): Promise<any> {
            const username = (userInfo.username || '').trim()
            const payload: LoginPayload = {
                loginType: userInfo.loginType || LoginType.PASSWORD, // 使用 LoginType 枚举值
                username
            }

            // 只有有值才带上，避免把空串传给后端
            if (userInfo.password) payload.password = userInfo.password
            if (userInfo.smsCode) payload.smsCode = userInfo.smsCode

            return new Promise((resolve, reject) => {
                login(payload)
                    .then(res => {
                        const token = res.token || (res.data && res.data.token)
                        setToken(token)
                        resolve(res)
                    })
                    .catch(err => reject(err))
            })
        },

        // 获取用户信息
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
                            // 验证返回的 roles 是否是一个非空数组
                            this.roles = res.roles
                            this.permissions = res.permissions
                        } else {
                            this.roles = ['ROLE_DEFAULT']
                        }
                        this.id = user.userId
                        this.name = user.userName
                        this.nickName = user.nickName
                        this.avatar = avatar
                        /* 初始密码提示 */
                        if (res.isDefaultModifyPwd) {
                            ElMessageBox.confirm('您的密码还是初始密码，请修改密码！', '安全提示', {
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
                        /* 过期密码提示 */
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

        // 退出系统
        logOut(): Promise<void> {
            return new Promise((resolve, reject) => {
                logout()
                    .then(() => {
                        this.token = ''
                        this.roles = []
                        this.permissions = []
                        removeToken()
                        resolve()
                    })
                    .catch(error => {
                        reject(error)
                    })
            })
        }
    }
})

export default useUserStore
