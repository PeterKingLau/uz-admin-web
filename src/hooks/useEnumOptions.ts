import { computed, type ComputedRef } from 'vue'
import { ENUM_TAG_CONFIG } from '@/utils/enum'

// 每一项配置的结构
interface EnumConfig {
    label: string
    type: string
    [key: string]: any
}

interface UseEnumOptionsOptions {
    includeKeys?: string[]
}

export interface EnumOption {
    value: string
    label: string
    type: string
    [key: string]: any
}

export function useEnumOptions(enumType: keyof typeof ENUM_TAG_CONFIG, options: UseEnumOptionsOptions = {}): ComputedRef<EnumOption[]> {
    const { includeKeys } = options

    return computed(() => {
        const group = ENUM_TAG_CONFIG[enumType] as Record<string, EnumConfig>
        const entries = Object.entries(group) as [string, EnumConfig][]

        return entries
            .filter(([value]) => !includeKeys || includeKeys.includes(value))
            .map(([value, cfg]) => {
                const { label, ...rest } = cfg
                return {
                    value,
                    label: label ?? String(value),
                    ...rest
                }
            })
    })
}
