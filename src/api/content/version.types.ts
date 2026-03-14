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
