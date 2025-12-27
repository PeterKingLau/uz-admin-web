import request from '@/utils/request'

export interface AssessmentOptionItem {
    [key: string]: any
}

export interface AssessmentOptionListParams {
    questionId: number
}

export interface AssessmentOptionListResponse {
    code?: number
    msg?: string
    total?: number
    data?: AssessmentOptionItem[] | Record<string, any>
    rows?: AssessmentOptionItem[]
}

export interface AddAssessmentOptionPayload {
    questionId: number
    content: string
    optionKey: string
    scoreValue: number
    sortOrder: number
}

export interface UpdateAssessmentOptionPayload {
    id: number
    content: string
    optionKey: string
    scoreValue: number
    sortOrder: number
}

/**
 * 根据题目id查询选项列表
 */
export function listAssessmentOptions(params: AssessmentOptionListParams) {
    return request<AssessmentOptionListResponse>({
        url: '/content/assessmentOption/list',
        method: 'get',
        params
    })
}

/**
 * 新增选项
 */
export function addAssessmentOption(data: AddAssessmentOptionPayload) {
    return request({
        url: '/content/assessmentOption/add',
        method: 'post',
        data
    })
}

/**
 * 修改选项
 */
export function updateAssessmentOption(data: UpdateAssessmentOptionPayload) {
    return request({
        url: '/content/assessmentOption/edit',
        method: 'post',
        data
    })
}

/**
 * 删除选项
 */
export function deleteAssessmentOption(ids: string | number) {
    return request({
        url: `/content/assessmentOption/${ids}`,
        method: 'delete'
    })
}

export function parseAssessmentOptionRows(payload: AssessmentOptionListResponse | any): AssessmentOptionItem[] {
    const rows = payload?.rows ?? payload?.data ?? payload
    if (Array.isArray(rows)) return rows
    if (Array.isArray(rows?.records)) return rows.records
    if (Array.isArray(rows?.list)) return rows.list
    return []
}
