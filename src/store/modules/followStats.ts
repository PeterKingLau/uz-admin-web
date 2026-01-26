// stores/followStats.ts - 关注数据状态管理（最保险版本 - 无类型错误）

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 关注数据统计接口
 */
export interface FollowStats {
    following: number
    followers: number
    mutualCount: number
}

/**
 * 缓存项接口
 */
interface FollowStatsCacheItem {
    data: FollowStats
    timestamp: number
    userId: string | number
}

const CACHE_TTL = 5 * 60 * 1000 // 5分钟过期

export const useFollowStatsStore = defineStore(
    'followStats',
    () => {
        // 内存缓存 Map: userId -> CacheItem
        const cache = ref<Map<string, FollowStatsCacheItem>>(new Map())

        // 加载状态 Map: userId -> boolean
        const loadingMap = ref<Map<string, boolean>>(new Map())

        /**
         * 检查缓存是否有效
         */
        const isValidCache = (item: FollowStatsCacheItem | undefined): boolean => {
            if (!item) return false
            return Date.now() - item.timestamp < CACHE_TTL
        }

        /**
         * 获取缓存的关注数据
         */
        const getCachedStats = (userId: string | number | null | undefined): FollowStats | null => {
            if (!userId) return null

            const key = String(userId)
            const item = cache.value.get(key)

            if (!item) return null

            // 检查是否过期
            if (!isValidCache(item)) {
                cache.value.delete(key)
                return null
            }

            return item.data
        }

        /**
         * 设置缓存数据
         */
        const setCachedStats = (userId: string | number | null | undefined, stats: FollowStats): void => {
            if (!userId || !stats) return

            const key = String(userId)
            cache.value.set(key, {
                data: {
                    following: stats.following ?? 0,
                    followers: stats.followers ?? 0,
                    mutualCount: stats.mutualCount ?? 0
                },
                timestamp: Date.now(),
                userId: key
            })
        }

        /**
         * 清除指定用户的缓存
         */
        const clearCache = (userId: string | number | null | undefined): void => {
            if (!userId) return
            cache.value.delete(String(userId))
        }

        /**
         * 清除所有缓存
         */
        const clearAllCache = (): void => {
            cache.value.clear()
        }

        /**
         * 清除过期缓存（定时任务）
         */
        const clearExpiredCache = (): void => {
            const now = Date.now()
            const keysToDelete: string[] = []

            cache.value.forEach((item, key) => {
                if (now - item.timestamp >= CACHE_TTL) {
                    keysToDelete.push(key)
                }
            })

            keysToDelete.forEach(key => cache.value.delete(key))
        }

        /**
         * 获取加载状态
         */
        const isLoading = (userId: string | number | null | undefined): boolean => {
            if (!userId) return false
            return loadingMap.value.get(String(userId)) ?? false
        }

        /**
         * 设置加载状态
         */
        const setLoading = (userId: string | number | null | undefined, loading: boolean): void => {
            if (!userId) return
            if (loading) {
                loadingMap.value.set(String(userId), true)
            } else {
                loadingMap.value.delete(String(userId))
            }
        }

        /**
         * 获取缓存剩余有效时间（毫秒）
         */
        const getCacheTTL = (userId: string | number | null | undefined): number => {
            if (!userId) return 0

            const item = cache.value.get(String(userId))
            if (!item) return 0

            const elapsed = Date.now() - item.timestamp
            const remaining = CACHE_TTL - elapsed

            return Math.max(0, remaining)
        }

        /**
         * 获取缓存大小
         */
        const cacheSize = computed(() => cache.value.size)

        /**
         * 获取所有缓存的用户 ID
         */
        const cachedUserIds = computed(() => Array.from(cache.value.keys()))

        return {
            // State
            cache,
            cacheSize,
            cachedUserIds,

            // Getters
            getCachedStats,
            isLoading,
            getCacheTTL,

            // Actions
            setCachedStats,
            clearCache,
            clearAllCache,
            clearExpiredCache,
            setLoading
        }
    },
    {
        persist: {
            key: 'follow-stats-cache',
            storage: sessionStorage,
            paths: ['cache'],
            serializer: {
                serialize: (state: any) => {
                    return JSON.stringify({
                        cache: Array.from(state.cache.entries())
                    })
                },
                deserialize: (value: string): any => {
                    const parsed = JSON.parse(value)
                    return {
                        cache: new Map(parsed.cache || [])
                    }
                }
            }
        } as any
    }
)
