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
 * 用户资料接口
 */
export interface UserProfile {
    userId?: string | number
    id?: string | number
    nickName?: string
    userName?: string
    avatar?: string
    bgImage?: string
    signature?: string
    sex?: string
    gender?: string
    // 关注状态相关字段
    follow?: boolean
    isFollow?: boolean
    isFollowing?: boolean
    followed?: boolean
    followStatus?: string | boolean
    isFollowed?: boolean
    followFlag?: string | boolean
    hasFollow?: boolean
    isAttention?: boolean
    attention?: boolean
    isFocus?: boolean
    focus?: boolean
    focusStatus?: string | boolean
    relationType?: string
    relation?: string
    followRelation?: string
    // 其他字段
    [key: string]: any
}

/**
 * 用户资料缓存项
 */
interface UserProfileCacheItem {
    profile: UserProfile
    followStats: FollowStats
    timestamp: number
    userId: string | number
}

const CACHE_TTL = 5 * 60 * 1000 // 5分钟过期

export const useUserProfileStore = defineStore(
    'userProfile',
    () => {
        // 用户资料缓存 Map: userId -> CacheItem
        const profileCache = ref<Map<string, UserProfileCacheItem>>(new Map())

        // 加载状态 Map: userId -> boolean
        const loadingMap = ref<Map<string, boolean>>(new Map())

        /**
         * 检查缓存是否有效
         */
        const isValidCache = (item: UserProfileCacheItem | undefined): boolean => {
            if (!item) return false
            return Date.now() - item.timestamp < CACHE_TTL
        }

        /**
         * 获取缓存的用户资料
         */
        const getCachedProfile = (userId: string | number | null | undefined): UserProfileCacheItem | null => {
            if (!userId) return null

            const key = String(userId)
            const item = profileCache.value.get(key)

            if (!item) return null

            // 检查是否过期
            if (!isValidCache(item)) {
                profileCache.value.delete(key)
                return null
            }

            return item
        }

        /**
         * 获取缓存的关注数据
         */
        const getCachedFollowStats = (userId: string | number | null | undefined): FollowStats | null => {
            const cached = getCachedProfile(userId)
            return cached ? cached.followStats : null
        }

        /**
         * 获取缓存的用户信息
         */
        const getCachedUserInfo = (userId: string | number | null | undefined): UserProfile | null => {
            const cached = getCachedProfile(userId)
            return cached ? cached.profile : null
        }

        /**
         * 设置缓存数据
         */
        const setCachedProfile = (userId: string | number | null | undefined, profile: UserProfile, followStats?: FollowStats): void => {
            if (!userId) return

            const key = String(userId)
            const existing = profileCache.value.get(key)

            profileCache.value.set(key, {
                profile: { ...profile },
                followStats: followStats ??
                    existing?.followStats ?? {
                        following: 0,
                        followers: 0,
                        mutualCount: 0
                    },
                timestamp: Date.now(),
                userId: key
            })
        }

        /**
         * 只更新关注数据
         */
        const updateFollowStats = (userId: string | number | null | undefined, followStats: FollowStats): void => {
            if (!userId) return
            const key = String(userId)
            const existing = profileCache.value.get(key)

            const nextItem: UserProfileCacheItem = {
                profile: { ...(existing?.profile ?? {}) },
                followStats: { ...followStats },
                timestamp: Date.now(),
                userId: key
            }

            profileCache.value.set(key, nextItem)
        }

        /**
         * 更新关注状态
         */
        const updateFollowStatus = (userId: string | number | null | undefined, isFollowing: boolean): void => {
            if (!userId) return
            const key = String(userId)
            const existing = profileCache.value.get(key)

            const baseProfile = existing?.profile ?? {}
            const nextProfile: UserProfile = {
                ...baseProfile,
                follow: isFollowing,
                isFollow: isFollowing,
                isFollowing: isFollowing,
                followed: isFollowing,
                followStatus: isFollowing ? '1' : '0',
                isFollowed: isFollowing,
                followFlag: isFollowing ? '1' : '0',
                hasFollow: isFollowing,
                isAttention: isFollowing,
                attention: isFollowing,
                isFocus: isFollowing,
                focus: isFollowing,
                focusStatus: isFollowing ? '1' : '0'
            }

            const nextItem: UserProfileCacheItem = {
                profile: nextProfile,
                followStats: existing?.followStats ?? { following: 0, followers: 0, mutualCount: 0 },
                timestamp: Date.now(),
                userId: key
            }

            // 关键：重新 set（触发持久化插件感知变更）
            profileCache.value.set(key, nextItem)
        }

        /**
         * 清除指定用户的缓存
         */
        const clearCache = (userId: string | number | null | undefined): void => {
            if (!userId) return
            profileCache.value.delete(String(userId))
        }

        /**
         * 清除所有缓存
         */
        const clearAllCache = (): void => {
            profileCache.value.clear()
        }

        /**
         * 清除过期缓存
         */
        const clearExpiredCache = (): void => {
            const now = Date.now()
            const keysToDelete: string[] = []

            profileCache.value.forEach((item, key) => {
                if (now - item.timestamp >= CACHE_TTL) {
                    keysToDelete.push(key)
                }
            })

            keysToDelete.forEach(key => profileCache.value.delete(key))
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

            const item = profileCache.value.get(String(userId))
            if (!item) return 0

            const elapsed = Date.now() - item.timestamp
            const remaining = CACHE_TTL - elapsed

            return Math.max(0, remaining)
        }

        /**
         * 获取缓存大小
         */
        const cacheSize = computed(() => profileCache.value.size)

        /**
         * 获取所有缓存的用户 ID
         */
        const cachedUserIds = computed(() => Array.from(profileCache.value.keys()))

        return {
            // State
            profileCache,
            cacheSize,
            cachedUserIds,

            // Getters
            getCachedProfile,
            getCachedFollowStats,
            getCachedUserInfo,
            isLoading,
            getCacheTTL,

            // Actions
            setCachedProfile,
            updateFollowStats,
            updateFollowStatus,
            clearCache,
            clearAllCache,
            clearExpiredCache,
            setLoading
        }
    },
    {
        persist: {
            key: 'user-profile-cache',
            storage: sessionStorage,
            pick: ['profileCache'],
            serializer: {
                serialize: (state: any) => {
                    return JSON.stringify({
                        profileCache: Array.from(state.profileCache.entries())
                    })
                },
                deserialize: (value: string): any => {
                    const parsed = JSON.parse(value)
                    return {
                        profileCache: new Map(parsed.profileCache || [])
                    }
                }
            }
        } as any
    }
)
