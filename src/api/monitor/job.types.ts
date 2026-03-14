export type JobId = string | number

export interface JobQuery extends Record<string, any> {}

export interface JobPayload extends Record<string, any> {}

export interface ChangeJobStatusPayload {
    jobId: JobId
    status: string | number
}

export interface RunJobPayload {
    jobId: JobId
    jobGroup: string
}
