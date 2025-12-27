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

export interface AddAssessmentQuestionPayload {
    moduleCode?: string
    type?: string
    content: string
    questionType: string
    correctAnswer?: string
    sortOrder: number
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

export function parseAssessmentQuestionRows(payload: AssessmentQuestionResponse | any): AssessmentQuestionItem[] {
    const rows = payload?.rows ?? payload?.data ?? payload
    if (Array.isArray(rows)) return rows
    if (Array.isArray(rows?.records)) return rows.records
    if (Array.isArray(rows?.list)) return rows.list
    return []
}
