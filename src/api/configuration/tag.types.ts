export interface InterestCategoryQuery {
    pageNum?: number
    pageSize?: number
    name?: string
    code?: string
}

export interface InterestCategoryItem {
    createBy?: string
    createTime?: string
    updateBy?: string
    updateTime?: string
    remark?: string | null
    id: number
    name: string
    code: string
    sortOrder: number
    isActive: string
}

export interface InterestCategoryBasePayload {
    name: string
    code: string
    sortOrder: number
    isActive: string
}

export interface InterestCategoryListRes {
    total: number
    rows: InterestCategoryItem[]
    code: number
    msg: string
}

export interface UpdateInterestCategoryPayload extends InterestCategoryBasePayload {
    id: number
}

export type AddInterestCategoryPayload = InterestCategoryBasePayload

export interface InterestTagQuery {
    pageNum?: number
    pageSize?: number
    name?: string
    isActive?: string
    categoryId: number
}

export interface InterestTagItem {
    id: number
    categoryId: number
    name: string
    description?: string
    isActive: string
    createTime?: string
    updateTime?: string
}

export interface InterestTagListRes {
    total: number
    rows: InterestTagItem[]
    code: number
    msg: string
}

export interface AddInterestTagPayload {
    name: string
    categoryId: number
    description?: string
    isActive: string
}

export interface UpdateInterestTagPayload {
    id: number
    name: string
    description?: string
    isActive: string
}
