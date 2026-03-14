import request from '@/utils/request'
import type { ChangeJobStatusPayload, JobId, JobPayload, JobQuery, RunJobPayload } from './job.types'

export type { ChangeJobStatusPayload, JobId, JobPayload, JobQuery, RunJobPayload } from './job.types'

export function listJob(query: JobQuery) {
    return request({
        url: '/monitor/job/list',
        method: 'get',
        params: query
    })
}

export function getJob(jobId: JobId) {
    return request({
        url: '/monitor/job/' + jobId,
        method: 'get'
    })
}

export function addJob(data: JobPayload) {
    return request({
        url: '/monitor/job',
        method: 'post',
        data
    })
}

export function updateJob(data: JobPayload) {
    return request({
        url: '/monitor/job',
        method: 'put',
        data
    })
}

export function delJob(jobId: JobId) {
    return request({
        url: '/monitor/job/' + jobId,
        method: 'delete'
    })
}

export function changeJobStatus(jobId: JobId, status: string | number) {
    const data: ChangeJobStatusPayload = {
        jobId,
        status
    }
    return request({
        url: '/monitor/job/changeStatus',
        method: 'put',
        data
    })
}

export function runJob(jobId: JobId, jobGroup: string) {
    const data: RunJobPayload = {
        jobId,
        jobGroup
    }
    return request({
        url: '/monitor/job/run',
        method: 'put',
        data
    })
}
