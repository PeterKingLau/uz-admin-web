import { ref, computed } from 'vue'
import { getDimensionTree, parseDimensionTree, type DimensionNode } from '@/api/content/assessmentQuestion'
import type { DimensionOption } from '../types'
import { DEFAULT_INTEREST_TAG_COLORS } from '../constants'

export function useDimension() {
    const dimensionTree = ref<DimensionNode[]>([])
    const dimensionLoading = ref(false)

    const dimensionNameMap = computed(() => {
        const map = new Map<string, string>()

        const walk = (nodes: DimensionNode[]) => {
            for (const node of nodes) {
                const code = node.dimensionCode ?? ''
                const name = node.dimensionName ?? ''
                if (code) map.set(String(code), String(name))
                if (node.children?.length) walk(node.children)
            }
        }

        walk(dimensionTree.value)
        return map
    })

    const dimensionCodeMap = computed(() => {
        const map = new Map<string, string>()

        const walk = (nodes: DimensionNode[]) => {
            for (const node of nodes) {
                const name = node.dimensionName ?? ''
                const code = node.dimensionCode ?? ''
                if (name && code) map.set(String(name), String(code))
                if (node.children?.length) walk(node.children)
            }
        }

        walk(dimensionTree.value)
        return map
    })

    const extractOptionsByCategory = (category: string): DimensionOption[] => {
        const options: DimensionOption[] = []

        const parentNode = dimensionTree.value.find(node => node.category === category || node.dimensionCode === category)

        if (!parentNode?.children) return options

        parentNode.children.forEach(child => {
            const value = String(child.dimensionCode ?? '').trim()
            const label = String(child.dimensionName ?? '').trim()

            if (value && label) {
                options.push({ label, value })
            }
        })

        return options
    }

    const interestTypeOptions = computed(() => {
        return extractOptionsByCategory('INTEREST')
    })

    const valueTypeOptions = computed(() => {
        return extractOptionsByCategory('VALUE')
    })

    const personalityTypeOptions = computed(() => {
        return extractOptionsByCategory('PERSONALITY')
    })

    const getInterestName = (code: string): string => {
        if (!code) return '-'
        return dimensionNameMap.value.get(code) || code
    }

    const getInterestTagType = (code: string): string => {
        if (!code) return 'info'
        return DEFAULT_INTEREST_TAG_COLORS[code] || 'info'
    }

    const withCurrentOption = (options: DimensionOption[], currentValue: string | number | undefined) => {
        const value = String(currentValue ?? '').trim()
        if (!value) return options
        if (options.some(option => option.value === value)) return options

        const label = dimensionNameMap.value.get(value) || value
        return [...options, { label, value }]
    }

    const normalizeDimensionValue = (input: string) => {
        const key = String(input || '').trim()
        if (!key) return ''
        return dimensionCodeMap.value.get(key) || key
    }

    const loadDimensionTree = async () => {
        dimensionLoading.value = true
        try {
            const res = await getDimensionTree()
            dimensionTree.value = parseDimensionTree(res) || []
        } catch (error) {
            console.error('加载维度树失败:', error)
            dimensionTree.value = []
            throw error
        } finally {
            dimensionLoading.value = false
        }
    }

    return {
        dimensionTree,
        dimensionLoading,
        dimensionNameMap,
        dimensionCodeMap,
        interestTypeOptions,
        valueTypeOptions,
        personalityTypeOptions,
        getInterestName,
        getInterestTagType,
        withCurrentOption,
        normalizeDimensionValue,
        loadDimensionTree
    }
}
