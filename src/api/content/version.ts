import request from '@/utils/request'

const ADD_VERSION_URL = '/content/version/v1/addVersion'
const LIST_VERSION_URL = '/content/version/list'
const REQUEST_TIMEOUT = 300000

export interface AddVersionPayload {
    versionCode: number | string
    versionName: string
    releaseNotes: string
    isForceUpdate: string | number | boolean
    file: File
}

export interface VersionItem {
    createBy?: string | null
    createTime?: string
    updateBy?: string | null
    updateTime?: string | null
    remark?: string | null
    id?: number
    platform?: string
    versionCode?: number | string
    versionName?: string
    downloadUrl?: string
    releaseNotes?: string
    isForceUpdate?: string
    status?: string
}

export interface AddVersionResponse {
    code: number
    msg: string
    data?: VersionItem
}

export interface DeleteVersionResponse {
    code: number
    msg: string
}

export interface ListVersionParams {
    pageNum?: number | string
    pageSize?: number | string
}

export interface ListVersionResponse {
    code?: number
    msg?: string
    total?: number
    rows?: VersionItem[]
    data?: any
}

const normalizeForceUpdate = (value: AddVersionPayload['isForceUpdate']): string => {
    if (typeof value === 'boolean') return value ? '1' : '0'
    if (value === null || value === undefined || value === '') return '0'
    return String(value)
}

export function addVersion(data: AddVersionPayload): Promise<AddVersionResponse> {
    const formData = new FormData()
    formData.append('versionCode', String(data.versionCode ?? ''))
    formData.append('versionName', String(data.versionName ?? '').trim())
    formData.append('releaseNotes', String(data.releaseNotes ?? '').trim())
    formData.append('isForceUpdate', normalizeForceUpdate(data.isForceUpdate))
    formData.append('file', data.file)

    return request<AddVersionResponse, AddVersionResponse>({
        url: ADD_VERSION_URL,
        method: 'post',
        data: formData,
        timeout: REQUEST_TIMEOUT
    })
}

export function listVersion(params?: ListVersionParams): Promise<ListVersionResponse> {
    return request<ListVersionResponse, ListVersionResponse>({
        url: LIST_VERSION_URL,
        method: 'get',
        params,
        timeout: REQUEST_TIMEOUT
    })
}

export function parseVersionRows(payload: ListVersionResponse | any): VersionItem[] {
    const rows = payload?.rows ?? payload?.data?.rows ?? payload?.data?.records ?? payload?.data?.list ?? payload?.data ?? payload
    if (Array.isArray(rows)) return rows
    return []
}

export function parseVersionTotal(payload: ListVersionResponse | any): number {
    const total = payload?.total ?? payload?.data?.total ?? payload?.data?.count
    if (Number.isFinite(Number(total))) return Number(total)
    return parseVersionRows(payload).length
}

export function deleteVersion(ids: Array<number | string> | number | string): Promise<DeleteVersionResponse> {
    const idList = Array.isArray(ids) ? ids : [ids]
    const normalizedIds = idList
        .map(item => String(item ?? '').trim())
        .filter(Boolean)
        .join(',')

    return request<DeleteVersionResponse, DeleteVersionResponse>({
        url: `/content/version/${normalizedIds}`,
        method: 'delete',
        timeout: REQUEST_TIMEOUT
    })
}
