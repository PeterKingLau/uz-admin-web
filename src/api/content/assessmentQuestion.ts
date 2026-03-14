import request from '@/utils/request'
import type {
    AddAssessmentQuestionPayload,
    AssessmentQuestionItem,
    AssessmentQuestionListParams,
    AssessmentQuestionResponse,
    DimensionNode,
    DimensionTreeResponse,
    UpdateAssessmentQuestionPayload
} from './assessmentQuestion.types'

export type {
    AddAssessmentQuestionPayload,
    AssessmentQuestionItem,
    AssessmentQuestionListParams,
    AssessmentQuestionResponse,
    DimensionNode,
    DimensionTreeResponse,
    UpdateAssessmentQuestionPayload
} from './assessmentQuestion.types'

export function listAssessmentQuestions(params?: AssessmentQuestionListParams) {
    return request<AssessmentQuestionResponse>({
        url: '/content/assessmentQuestion/list',
        method: 'get',
        params
    })
}

export function addAssessmentQuestion(data: AddAssessmentQuestionPayload) {
    return request({
        url: '/content/assessmentQuestion/add',
        method: 'post',
        data
    })
}

export function updateAssessmentQuestion(data: UpdateAssessmentQuestionPayload) {
    return request({
        url: '/content/assessmentQuestion/edit',
        method: 'post',
        data
    })
}

export function deleteAssessmentQuestion(ids: string | number) {
    return request({
        url: `/content/assessmentQuestion/${ids}`,
        method: 'delete'
    })
}

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
