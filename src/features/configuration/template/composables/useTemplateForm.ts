import { ref, reactive } from 'vue'
import type { TemplateForm, RepresentativeItem } from '@/features/configuration/template/types'
import { TEXT_MAP } from '@/features/configuration/template/constants'

function safeParseJson(value: unknown) {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    if (!trimmed) return value
    const isJsonLike =
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('{') && trimmed.endsWith('}'))
    if (!isJsonLike) return value
    try {
        return JSON.parse(trimmed)
    } catch {
        return value
    }
}

function pickString(...values: unknown[]) {
    for (const value of values) {
        const normalized = String(value ?? '').trim()
        if (normalized) return normalized
    }
    return ''
}

export function useTemplateForm() {
    const formRef = ref()
    const open = ref(false)
    const dialogTitle = ref<string>(TEXT_MAP.addTitle)
    const submitLoading = ref(false)
    const currentEditId = ref<number | null>(null)

    const form = reactive<TemplateForm>({
        id: undefined,
        interestType: '',
        abilityLevel: 2,
        valueType: '',
        personalityTrait: '',
        interestDesc: '',
        abilityDesc: '',
        valueDesc: '',
        personalityDesc: '',
        comprehensiveDesc: '',
        representativeList: []
    })

    const rules = {
        interestType: [{ required: true, message: TEXT_MAP.interestTypePlaceholder, trigger: 'change' }],
        abilityLevel: [{ required: true, message: TEXT_MAP.abilityLevelPlaceholder, trigger: 'change' }],
        valueType: [{ required: true, message: TEXT_MAP.valueTypePlaceholder, trigger: 'change' }],
        personalityTrait: [{ required: true, message: TEXT_MAP.personalityTraitPlaceholder, trigger: 'change' }],
        interestDesc: [{ required: true, message: TEXT_MAP.interestDescPlaceholder, trigger: 'blur' }],
        abilityDesc: [{ required: true, message: TEXT_MAP.abilityDescPlaceholder, trigger: 'blur' }],
        valueDesc: [{ required: true, message: TEXT_MAP.valueDescPlaceholder, trigger: 'blur' }],
        personalityDesc: [{ required: true, message: TEXT_MAP.personalityDescPlaceholder, trigger: 'blur' }],
        comprehensiveDesc: [{ required: false, message: TEXT_MAP.comprehensiveDescPlaceholder, trigger: 'blur' }]
    }

    const resetForm = () => {
        formRef.value?.resetFields?.()
        Object.assign(form, {
            id: undefined,
            interestType: '',
            abilityLevel: 2,
            valueType: '',
            personalityTrait: '',
            interestDesc: '',
            abilityDesc: '',
            valueDesc: '',
            personalityDesc: '',
            comprehensiveDesc: '',
            representativeList: []
        })
    }

    const addRepresentative = () => {
        form.representativeList.push({ name: '', description: '', image: '' })
    }

    const removeRepresentative = (index: number) => {
        form.representativeList.splice(index, 1)
    }

    const normalizeRepresentativeList = (list: any): RepresentativeItem[] => {
        const parsedList = safeParseJson(list)
        if (!Array.isArray(parsedList)) return []

        return parsedList
            .map((item: any) => ({
                name: pickString(item?.name, item?.personName, item?.representativeName, item?.title),
                description: pickString(item?.description, item?.desc, item?.remark, item?.introduction, item?.summary),
                image: pickString(item?.image, item?.imageUrl, item?.avatar, item?.avatarUrl, item?.url, item?.fileUrl, item?.picture)
            }))
            .filter(item => item.name || item.description || item.image)
    }

    return {
        formRef,
        open,
        dialogTitle,
        submitLoading,
        currentEditId,
        form,
        rules,
        resetForm,
        addRepresentative,
        removeRepresentative,
        normalizeRepresentativeList
    }
}
