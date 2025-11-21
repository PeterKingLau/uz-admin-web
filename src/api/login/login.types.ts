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
