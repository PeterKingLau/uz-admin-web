export type UserId = string | number

export interface SelectFollowNumParams {
    targetUserId?: UserId
}

export interface FollowListParams {
    lastId?: UserId
    size?: number | string
}

export interface ToggleFollowUserPayload {
    targetUserId: UserId
}
