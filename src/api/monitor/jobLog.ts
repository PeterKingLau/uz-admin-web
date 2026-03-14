import request from '@/utils/request'
import type { JobLogId, JobLogQuery } from './jobLog.types'

export type { JobLogId, JobLogQuery } from './jobLog.types'

export function listJobLog(query: JobLogQuery) {
    return request({
        url: '/monitor/jobLog/list',
        method: 'get',
        params: query
    })
}

export function delJobLog(jobLogId: JobLogId) {
    return request({
        url: '/monitor/jobLog/' + jobLogId,
        method: 'delete'
    })
}

export function cleanJobLog() {
    return request({
        url: '/monitor/jobLog/clean',
        method: 'delete'
    })
}
