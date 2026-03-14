import request from '@/utils/request'
import type { CacheKey, CacheName } from './cache.types'

export type { CacheKey, CacheName } from './cache.types'

export function getCache() {
    return request({
        url: '/monitor/cache',
        method: 'get'
    })
}

export function listCacheName() {
    return request({
        url: '/monitor/cache/getNames',
        method: 'get'
    })
}

export function listCacheKey(cacheName: CacheName) {
    return request({
        url: '/monitor/cache/getKeys/' + cacheName,
        method: 'get'
    })
}

export function getCacheValue(cacheName: CacheName, cacheKey: CacheKey) {
    return request({
        url: '/monitor/cache/getValue/' + cacheName + '/' + cacheKey,
        method: 'get'
    })
}

export function clearCacheName(cacheName: CacheName) {
    return request({
        url: '/monitor/cache/clearCacheName/' + cacheName,
        method: 'delete'
    })
}

export function clearCacheKey(cacheKey: CacheKey) {
    return request({
        url: '/monitor/cache/clearCacheKey/' + cacheKey,
        method: 'delete'
    })
}

export function clearCacheAll() {
    return request({
        url: '/monitor/cache/clearCacheAll',
        method: 'delete'
    })
}
