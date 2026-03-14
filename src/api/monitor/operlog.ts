import request from '@/utils/request'
import type { OperId, OperlogQuery } from './operlog.types'

export type { OperId, OperlogQuery } from './operlog.types'

export function list(query: OperlogQuery) {
    return request({
        url: '/monitor/operlog/list',
        method: 'get',
        params: query
    })
}

export function delOperlog(operId: OperId) {
    return request({
        url: '/monitor/operlog/' + operId,
        method: 'delete'
    })
}

export function cleanOperlog() {
    return request({
        url: '/monitor/operlog/clean',
        method: 'delete'
    })
}
