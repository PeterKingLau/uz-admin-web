import { defineStore } from 'pinia'
import { ref } from 'vue'

type JoinKey = string

export const useCircleJoinStore = defineStore(
    'circleJoin',
    () => {
        const joinMap = ref<Map<JoinKey, boolean>>(new Map())

        const getKey = (userId: string | number | null | undefined, circleId: string | number | null | undefined): JoinKey => {
            const user = userId ? String(userId) : 'guest'
            const circle = circleId ? String(circleId) : ''
            return `${user}:${circle}`
        }

        const getJoined = (userId: string | number | null | undefined, circleId: string | number | null | undefined): boolean | null => {
            if (!circleId) return null
            const key = getKey(userId, circleId)
            return joinMap.value.has(key) ? (joinMap.value.get(key) as boolean) : null
        }

        const setJoined = (userId: string | number | null | undefined, circleId: string | number | null | undefined, joined: boolean): void => {
            if (!circleId) return
            joinMap.value.set(getKey(userId, circleId), joined)
        }

        const clearUser = (userId: string | number | null | undefined): void => {
            const user = userId ? String(userId) : 'guest'
            const prefix = `${user}:`
            Array.from(joinMap.value.keys()).forEach(key => {
                if (key.startsWith(prefix)) joinMap.value.delete(key)
            })
        }

        const clearAll = (): void => {
            joinMap.value.clear()
        }

        return {
            joinMap,
            getJoined,
            setJoined,
            clearUser,
            clearAll
        }
    },
    {
        persist: {
            key: 'circle-join',
            storage: localStorage,
            paths: ['joinMap'],
            serializer: {
                serialize: (state: any) => JSON.stringify({ joinMap: Array.from(state.joinMap.entries()) }),
                deserialize: (value: string): any => {
                    const parsed = JSON.parse(value)
                    return {
                        joinMap: new Map(parsed.joinMap || [])
                    }
                }
            }
        } as any
    }
)
