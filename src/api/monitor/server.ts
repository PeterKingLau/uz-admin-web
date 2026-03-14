import request from '@/utils/request'
import type { ServerInfo } from './server.types'

export type { ServerInfo } from './server.types'

export function getServer() {
    return request<ServerInfo>({
        url: '/monitor/server',
        method: 'get'
    })
}
