import request from '@/utils/request'
import type {
    CompetitionForm,
    CompetitionItem,
    CompetitionListParams,
    CompetitionListResponse,
    CompetitionWorkForm,
    CompetitionWorkItem,
    CompetitionWorkListParams,
    CompetitionWorkListResponse
} from './competition.types'

export type {
    CompetitionForm,
    CompetitionItem,
    CompetitionListParams,
    CompetitionListResponse,
    CompetitionWorkForm,
    CompetitionWorkItem,
    CompetitionWorkListParams,
    CompetitionWorkListResponse
}

export function listCompetition(params?: CompetitionListParams) {
    return request<CompetitionListResponse>({
        url: '/content/competition/list',
        method: 'get',
        params
    })
}

export function getCompetition(id: string | number) {
    return request<CompetitionItem>({
        url: `/content/competition/${id}`,
        method: 'get'
    })
}

export function addCompetition(data: CompetitionForm) {
    return request({
        url: '/content/competition',
        method: 'post',
        data
    })
}

export function updateCompetition(data: CompetitionForm) {
    return request({
        url: '/content/competition',
        method: 'put',
        data
    })
}

export function delCompetition(ids: string | number | Array<string | number>) {
    const idPath = Array.isArray(ids) ? ids.join(',') : ids
    return request({
        url: `/content/competition/${idPath}`,
        method: 'delete'
    })
}

export function parseCompetitionRows(payload: CompetitionListResponse | any): CompetitionItem[] {
    const rows = payload?.rows ?? payload?.data ?? payload
    if (Array.isArray(rows)) return rows
    if (Array.isArray(rows?.records)) return rows.records
    if (Array.isArray(rows?.list)) return rows.list
    if (Array.isArray(rows?.items)) return rows.items
    return []
}

export function parseCompetitionTotal(payload: CompetitionListResponse | any, rows: CompetitionItem[] = []): number {
    const total = payload?.total ?? payload?.data?.total ?? payload?.data?.totalCount ?? payload?.totalCount
    const value = Number(total)
    return Number.isFinite(value) ? value : rows.length
}

export function parseCompetitionDetail(payload: CompetitionItem | any): CompetitionItem {
    const data = payload?.data ?? payload
    return data || {}
}

export function listCompetitionWork(params?: CompetitionWorkListParams) {
    return request<CompetitionWorkListResponse>({
        url: '/content/competition/work/list',
        method: 'get',
        params
    })
}

export function getCompetitionWork(id: string | number) {
    return request<CompetitionWorkItem>({
        url: `/content/competition/work/${id}`,
        method: 'get'
    })
}

export function addCompetitionWork(data: CompetitionWorkForm) {
    return request({
        url: '/content/competition/work',
        method: 'post',
        data
    })
}

export function updateCompetitionWork(data: CompetitionWorkForm) {
    return request({
        url: '/content/competition/work',
        method: 'put',
        data
    })
}

export function delCompetitionWork(ids: string | number | Array<string | number>) {
    const idPath = Array.isArray(ids) ? ids.join(',') : ids
    return request({
        url: `/content/competition/work/${idPath}`,
        method: 'delete'
    })
}

export function parseCompetitionWorkRows(payload: CompetitionWorkListResponse | any): CompetitionWorkItem[] {
    const rows = payload?.rows ?? payload?.data ?? payload
    if (Array.isArray(rows)) return rows
    if (Array.isArray(rows?.records)) return rows.records
    if (Array.isArray(rows?.list)) return rows.list
    if (Array.isArray(rows?.items)) return rows.items
    return []
}

export function parseCompetitionWorkTotal(payload: CompetitionWorkListResponse | any, rows: CompetitionWorkItem[] = []): number {
    const total = payload?.total ?? payload?.data?.total ?? payload?.data?.totalCount ?? payload?.totalCount
    const value = Number(total)
    return Number.isFinite(value) ? value : rows.length
}

export function parseCompetitionWorkDetail(payload: CompetitionWorkItem | any): CompetitionWorkItem {
    const data = payload?.data ?? payload
    return data || {}
}
