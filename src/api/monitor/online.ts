import request from '@/utils/request'
import type { OnlineQuery, TokenId } from './online.types'

export type { OnlineQuery, TokenId } from './online.types'

export function list(query: OnlineQuery) {
    return request({
        url: '/monitor/online/list',
        method: 'get',
        params: query
    })
}

export function forceLogout(tokenId: TokenId) {
    return request({
        url: '/monitor/online/' + tokenId,
        method: 'delete'
    })
}
