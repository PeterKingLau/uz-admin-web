export type UserId = string | number

export interface UserQuery extends Record<string, any> {}

export interface UserPayload extends Record<string, any> {}

export interface ResetUserPwdPayload {
    userId: UserId
    password: string
}

export interface ChangeUserStatusPayload {
    userId: UserId
    status: string | number
}

export interface UpdateUserPwdPayload {
    oldPassword: string
    newPassword: string
}

export interface AuthRolePayload extends Record<string, any> {}
