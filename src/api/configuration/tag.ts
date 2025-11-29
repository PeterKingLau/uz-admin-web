import request from '@/utils/request'

/** 标签父级列表查询参数 */
export interface InterestCategoryQuery {
    pageNum?: number
    pageSize?: number
    /** 标签名称 */
    name?: string
    /** 标签编码 */
    code?: string
}

/** 单条标签父级记录 */
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
    /** 是否启用：'1' 启用 / 其他 停用 */
    isActive: string
}

/** 标签父级基础入参 */
export interface InterestCategoryBasePayload {
    name: string
    code: string
    sortOrder: number
    /** 是否启用，'1' 启用 / 其他 停用 */
    isActive: string
}

/** 接口返回结构 */
export interface InterestCategoryListRes {
    total: number
    rows: InterestCategoryItem[]
    code: number
    msg: string
}

/** 修改标签父级请求体 */
export interface UpdateInterestCategoryPayload extends InterestCategoryBasePayload {
    id: number
}

/** 新增标签父级请求体 */
export type AddInterestCategoryPayload = InterestCategoryBasePayload

/** 标签父级查询 */
export function listInterestCategory(query: InterestCategoryQuery) {
    return request<InterestCategoryListRes>({
        url: '/content/interestCategory/list',
        method: 'get',
        params: query
    })
}

/** 标签父级修改 */
export function updateInterestCategory(data: UpdateInterestCategoryPayload) {
    return request({
        url: '/content/interestCategory/update',
        method: 'post',
        data
    })
}

/** 标签父级新增 */
export function addInterestCategory(data: AddInterestCategoryPayload) {
    return request({
        url: '/content/interestCategory',
        method: 'post',
        data
    })
}

/** 标签父级删除 */
export function deleteInterestCategory(id: number) {
    return request({
        url: '/content/interestCategory/delete',
        method: 'post',
        params: { id }
    })
}

/** 子级标签查询参数 */
export interface InterestTagQuery {
    pageNum?: number
    pageSize?: number
    name?: string
    isActive?: string
    /** 父级ID */
    categoryId: number
}

/** 子级标签记录 */
export interface InterestTagItem {
    id: number
    categoryId: number
    name: string
    description?: string
    isActive: string
    createTime?: string
    updateTime?: string
}

/** 子级标签列表返回 */
export interface InterestTagListRes {
    total: number
    rows: InterestTagItem[]
    code: number
    msg: string
}

/** 子级标签新增 */
export interface AddInterestTagPayload {
    name: string
    categoryId: number
    description?: string
    isActive: string
}

/** 子级标签修改 */
export interface UpdateInterestTagPayload {
    id: number
    name: string
    description?: string
    isActive: string
}

export function listInterestTag(query: InterestTagQuery) {
    return request<InterestTagListRes>({
        url: '/content/interestTag/list',
        method: 'get',
        params: query
    })
}

export function addInterestTag(data: AddInterestTagPayload) {
    return request({
        url: '/content/interestTag',
        method: 'post',
        data
    })
}

export function updateInterestTag(data: UpdateInterestTagPayload) {
    return request({
        url: '/content/interestTag/update',
        method: 'post',
        data
    })
}

export function deleteInterestTag(id: number) {
    return request({
        url: '/content/interestTag/delete',
        method: 'post',
        params: { id }
    })
}
