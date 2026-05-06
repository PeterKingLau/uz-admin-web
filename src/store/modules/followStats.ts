

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'




export interface FollowStats {
    following: number
    followers: number
    mutualCount: number
}




interface FollowStatsCacheItem {
    data: FollowStats
    timestamp: number
    userId: string | number
}

const CACHE_TTL = 5 * 60 * 1000 

export const useFollowStatsStore = defineStore(
    'followStats',
    () => {
        
        const cache = ref<Map<string, FollowStatsCacheItem>>(new Map())

        
        const loadingMap = ref<Map<string, boolean>>(new Map())

        


        const isValidCache = (item: FollowStatsCacheItem | undefined): boolean => {
            if (!item) return false
            return Date.now() - item.timestamp < CACHE_TTL
        }

        


        const getCachedStats = (userId: string | number | null | undefined): FollowStats | null => {
            if (!userId) return null

            const key = String(userId)
            const item = cache.value.get(key)

            if (!item) return null

            
            if (!isValidCache(item)) {
                cache.value.delete(key)
                return null
            }

            return item.data
        }

        


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

        


        const clearCache = (userId: string | number | null | undefined): void => {
            if (!userId) return
            cache.value.delete(String(userId))
        }

        


        const clearAllCache = (): void => {
            cache.value.clear()
        }

        


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

        


        const isLoading = (userId: string | number | null | undefined): boolean => {
            if (!userId) return false
            return loadingMap.value.get(String(userId)) ?? false
        }

        


        const setLoading = (userId: string | number | null | undefined, loading: boolean): void => {
            if (!userId) return
            if (loading) {
                loadingMap.value.set(String(userId), true)
            } else {
                loadingMap.value.delete(String(userId))
            }
        }

        


        const getCacheTTL = (userId: string | number | null | undefined): number => {
            if (!userId) return 0

            const item = cache.value.get(String(userId))
            if (!item) return 0

            const elapsed = Date.now() - item.timestamp
            const remaining = CACHE_TTL - elapsed

            return Math.max(0, remaining)
        }

        


        const cacheSize = computed(() => cache.value.size)

        


        const cachedUserIds = computed(() => Array.from(cache.value.keys()))

        return {
            
            cache,
            cacheSize,
            cachedUserIds,

            
            getCachedStats,
            isLoading,
            getCacheTTL,

            
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
