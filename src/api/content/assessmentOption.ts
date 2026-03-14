import request from '@/utils/request'
import type {
    AddAssessmentOptionPayload,
    AssessmentOptionItem,
    AssessmentOptionListParams,
    AssessmentOptionListResponse,
    UpdateAssessmentOptionPayload
} from './assessmentOption.types'

export type {
    AddAssessmentOptionPayload,
    AssessmentOptionItem,
    AssessmentOptionListParams,
    AssessmentOptionListResponse,
    UpdateAssessmentOptionPayload
} from './assessmentOption.types'

export function listAssessmentOptions(params: AssessmentOptionListParams) {
    return request<AssessmentOptionListResponse>({
        url: '/content/assessmentOption/list',
        method: 'get',
        params
    })
}

export function addAssessmentOption(data: AddAssessmentOptionPayload) {
    return request({
        url: '/content/assessmentOption/add',
        method: 'post',
        data
    })
}

export function updateAssessmentOption(data: UpdateAssessmentOptionPayload) {
    return request({
        url: '/content/assessmentOption/edit',
        method: 'post',
        data
    })
}

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
