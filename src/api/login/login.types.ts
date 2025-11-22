/** 登录方式 */
export type LoginType = 'PASSWORD' | 'SMS'

/** 登录入参 */
export interface LoginParams {
    username: string
    password?: string
    loginType?: LoginType
    smsCode?: string
}

/** 发送短信验证码入参 */
export type SendPhoneCodeParams = string

/** 注册入参（按需再扩展） */
export interface RegisterParams {
    username: string
    password: string
    [key: string]: any
}

// 定义登录接口返回的类型
export interface LoginResponse {
    token: string // 服务器返回的token字段
    // 其他可能返回的字段
    data?: any
}

// 定义接口返回的类型
export interface UserInfoResponse {
    user: {
        userId: string
        userName: string
        nickName: string
        avatar: string
    }
    roles: string[]
    permissions: string[]
    isDefaultModifyPwd: boolean
    isPasswordExpired: boolean
}
