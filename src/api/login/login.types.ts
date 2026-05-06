
export type LoginType = 'PASSWORD' | 'SMS'


export interface LoginParams {
    username: string
    password?: string
    loginType?: LoginType
    smsCode?: string
}


export type SendPhoneCodeParams = string


export interface RegisterParams {
    username: string
    password: string
    [key: string]: any
}


export interface LoginResponse {
    token: string 
    
    data?: any
}


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
