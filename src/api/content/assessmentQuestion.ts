import request from '@/utils/request'

export interface AssessmentQuestionItem {
    [key: string]: any
}

export interface AssessmentQuestionResponse {
    code?: number
    msg?: string
    total?: number
    data?: AssessmentQuestionItem[] | Record<string, any>
    rows?: AssessmentQuestionItem[]
}

export interface AssessmentQuestionListParams {
    pageNum?: number
    pageSize?: number
    title?: string
}

export interface DimensionNode {
    id?: number
    pid?: number
    category?: string
    dimensionCode?: string
    dimensionName?: string
    sortOrder?: number
    isActive?: string
    children?: DimensionNode[]
}

export interface DimensionTreeResponse {
    code?: number
    msg?: string
    data?: DimensionNode[] | Record<string, any>
    rows?: DimensionNode[]
}

export interface AddAssessmentQuestionPayload {
    moduleCode?: string
    type?: string
    content: string
    questionType: string
    correctAnswer?: string
    sortOrder: number
    status?: string
}

export interface UpdateAssessmentQuestionPayload extends AddAssessmentQuestionPayload {
    id: number
}

/**
 * 查询题目列表
 */
export function listAssessmentQuestions(params?: AssessmentQuestionListParams) {
    return request<AssessmentQuestionResponse>({
        url: '/content/assessmentQuestion/list',
        method: 'get',
        params
    })
}

/**
 * 新增题目
 */
export function addAssessmentQuestion(data: AddAssessmentQuestionPayload) {
    return request({
        url: '/content/assessmentQuestion/add',
        method: 'post',
        data
    })
}

/**
 * 修改题目
 */
export function updateAssessmentQuestion(data: UpdateAssessmentQuestionPayload) {
    return request({
        url: '/content/assessmentQuestion/edit',
        method: 'post',
        data
    })
}

/**
 * 删除题目
 */
export function deleteAssessmentQuestion(ids: string | number) {
    return request({
        url: `/content/assessmentQuestion/${ids}`,
        method: 'delete'
    })
}

/**
 * 查询维度树
 */
export function getDimensionTree() {
    return request<DimensionTreeResponse>({
        url: '/content/assessmentQuestion/getDimensionTree',
        method: 'get'
    })
}

export function parseAssessmentQuestionRows(payload: AssessmentQuestionResponse | any): AssessmentQuestionItem[] {
    const rows = payload?.rows ?? payload?.data ?? payload
    if (Array.isArray(rows)) return rows
    if (Array.isArray(rows?.records)) return rows.records
    if (Array.isArray(rows?.list)) return rows.list
    return []
}

export function parseDimensionTree(payload: DimensionTreeResponse | any): DimensionNode[] {
    const rows = payload?.rows ?? payload?.data ?? payload
    if (Array.isArray(rows)) return rows
    if (Array.isArray(rows?.records)) return rows.records
    if (Array.isArray(rows?.list)) return rows.list
    return []
}
