import request from '@/utils/request'
import { LoginParams, LoginType, RegisterParams, SendPhoneCodeParams } from './login.types'
import { LoginResponse, UserInfoResponse } from './login.types'

/** 登录方法 */
export function login(params: LoginParams): Promise<LoginResponse> {
    // 指定返回类型
    const { username, password, loginType = 'PASSWORD', smsCode = '' } = params

    const data: {
        username: string
        loginType: LoginType
        password?: string
        smsCode?: string
    } = {
        username,
        loginType
    }

    if (loginType === 'PASSWORD' && password) {
        data.password = password
    }

    if (loginType === 'SMS' && smsCode) {
        data.smsCode = smsCode
    }

    return request({
        url: '/login',
        headers: {
            isToken: false,
            repeatSubmit: false
        },
        method: 'post',
        data
    }) as Promise<LoginResponse> // 明确指定返回类型
}

/** 发送短信验证码 */
export function sendPhoneCode(username: SendPhoneCodeParams) {
    return request({
        url: '/sendPhoneCode',
        method: 'post',
        headers: {
            isToken: false,
            repeatSubmit: false
        },
        data: { username }
    })
}

/** 注册方法 */
export function register(data: RegisterParams) {
    return request({
        url: '/register',
        headers: {
            isToken: false
        },
        method: 'post',
        data
    })
}

/** 获取用户详细信息 */
export function getInfo(): Promise<UserInfoResponse> {
    return request({
        url: '/getInfo',
        method: 'get'
    })
}

/** 退出方法 */
export function logout() {
    return request({
        url: '/logout',
        method: 'post'
    })
}

/** 获取验证码 */
export function getCodeImg() {
    return request({
        url: '/captchaImage',
        headers: {
            isToken: false
        },
        method: 'get',
        timeout: 20000
    })
}
