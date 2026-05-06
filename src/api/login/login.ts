import request from '@/utils/request'
import { LoginParams, LoginType, RegisterParams, SendPhoneCodeParams } from './login.types'
import { LoginResponse, UserInfoResponse } from './login.types'


export function login(params: LoginParams): Promise<LoginResponse> {
    
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
    }) as Promise<LoginResponse> 
}


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


export function getInfo(): Promise<UserInfoResponse> {
    return request({
        url: '/getInfo',
        method: 'get'
    })
}


export function logout() {
    return request({
        url: '/logout',
        method: 'post'
    })
}


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
