export type RoleId = string | number

export interface RoleQuery extends Record<string, any> {}

export interface RolePayload extends Record<string, any> {}

export interface ChangeRoleStatusPayload {
    roleId: RoleId
    status: string | number
}

export interface RoleAuthUserPayload extends Record<string, any> {}
