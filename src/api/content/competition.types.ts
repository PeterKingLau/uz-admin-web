export interface CompetitionListParams {
    pageNum?: number
    pageSize?: number
    title?: string
    status?: string | number
    isActive?: string | number
}

export interface CompetitionForm {
    id?: string | number
    remark?: string
    title?: string
    themeImage?: string
    description?: string
    startTime?: string
    endTime?: string
    voteDeadline?: string
    status?: string | number
    isActive?: string | number
}

export interface CompetitionItem extends CompetitionForm {
    competitionId?: string | number
    name?: string
    statusLabel?: string
    active?: string | number | boolean
    totalVotes?: number
    voteCount?: number
    votes?: number
    workCount?: number
    worksCount?: number
    entryCount?: number
    viewCount?: number
    browseCount?: number
    views?: number
    createTime?: string
    updateTime?: string
}

export interface CompetitionListResponse {
    code?: number
    msg?: string
    rows?: CompetitionItem[]
    data?: CompetitionItem[] | { records?: CompetitionItem[]; list?: CompetitionItem[]; total?: number }
    total?: number
}

export interface CompetitionWorkListParams {
    pageNum?: number
    pageSize?: number
    competitionId?: string | number
    authorName?: string
    workName?: string
    status?: string | number
}

export interface CompetitionWorkForm {
    id?: string | number
    remark?: string
    competitionId?: string | number
    authorName?: string
    workName?: string
    workDescription?: string
    mediaUrl?: string
    mediaType?: string | number
    coverUrl?: string
    status?: string | number
}

export interface CompetitionWorkItem extends CompetitionWorkForm {
    workId?: string | number
    voteCount?: number
    votes?: number
    rank?: number
    ranking?: number
    createTime?: string
    updateTime?: string
}

export interface CompetitionWorkListResponse {
    code?: number
    msg?: string
    rows?: CompetitionWorkItem[]
    data?: CompetitionWorkItem[] | { records?: CompetitionWorkItem[]; list?: CompetitionWorkItem[]; total?: number }
    total?: number
}
