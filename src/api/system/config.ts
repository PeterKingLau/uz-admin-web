import request from '@/utils/request'
import type { ConfigId, ConfigPayload, ConfigQuery } from './config.types'

export type { ConfigId, ConfigPayload, ConfigQuery } from './config.types'

export function listConfig(query: ConfigQuery) {
    return request({
        url: '/system/config/list',
        method: 'get',
        params: query
    })
}

export function getConfig(configId: ConfigId) {
    return request({
        url: '/system/config/' + configId,
        method: 'get'
    })
}

export function getConfigKey(configKey: string) {
    return request({
        url: '/system/config/configKey/' + configKey,
        method: 'get'
    })
}

export function addConfig(data: ConfigPayload) {
    return request({
        url: '/system/config',
        method: 'post',
        data
    })
}

export function updateConfig(data: ConfigPayload) {
    return request({
        url: '/system/config',
        method: 'put',
        data
    })
}

export function delConfig(configId: ConfigId) {
    return request({
        url: '/system/config/' + configId,
        method: 'delete'
    })
}

export function refreshCache() {
    return request({
        url: '/system/config/refreshCache',
        method: 'delete'
    })
}
