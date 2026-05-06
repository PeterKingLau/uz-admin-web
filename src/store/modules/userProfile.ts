import { defineStore } from 'pinia'
import { ref, computed } from 'vue'




export interface FollowStats {
    following: number
    followers: number
    mutualCount: number
}




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
    
    [key: string]: any
}




interface UserProfileCacheItem {
    profile: UserProfile
    followStats: FollowStats
    timestamp: number
    userId: string | number
}

const CACHE_TTL = 5 * 60 * 1000 

export const useUserProfileStore = defineStore(
    'userProfile',
    () => {
        
        const profileCache = ref<Map<string, UserProfileCacheItem>>(new Map())

        
        const loadingMap = ref<Map<string, boolean>>(new Map())

        


        const isValidCache = (item: UserProfileCacheItem | undefined): boolean => {
            if (!item) return false
            return Date.now() - item.timestamp < CACHE_TTL
        }

        


        const getCachedProfile = (userId: string | number | null | undefined): UserProfileCacheItem | null => {
            if (!userId) return null

            const key = String(userId)
            const item = profileCache.value.get(key)

            if (!item) return null

            
            if (!isValidCache(item)) {
                profileCache.value.delete(key)
                return null
            }

            return item
        }

        


        const getCachedFollowStats = (userId: string | number | null | undefined): FollowStats | null => {
            const cached = getCachedProfile(userId)
            return cached ? cached.followStats : null
        }

        


        const getCachedUserInfo = (userId: string | number | null | undefined): UserProfile | null => {
            const cached = getCachedProfile(userId)
            return cached ? cached.profile : null
        }

        


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

            
            profileCache.value.set(key, nextItem)
        }

        


        const clearCache = (userId: string | number | null | undefined): void => {
            if (!userId) return
            profileCache.value.delete(String(userId))
        }

        


        const clearAllCache = (): void => {
            profileCache.value.clear()
        }

        


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

            const item = profileCache.value.get(String(userId))
            if (!item) return 0

            const elapsed = Date.now() - item.timestamp
            const remaining = CACHE_TTL - elapsed

            return Math.max(0, remaining)
        }

        


        const cacheSize = computed(() => profileCache.value.size)

        


        const cachedUserIds = computed(() => Array.from(profileCache.value.keys()))

        return {
            
            profileCache,
            cacheSize,
            cachedUserIds,

            
            getCachedProfile,
            getCachedFollowStats,
            getCachedUserInfo,
            isLoading,
            getCacheTTL,

            
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
