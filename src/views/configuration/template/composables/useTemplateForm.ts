import { ref, reactive, computed } from 'vue'
import type { TemplateForm, RepresentativeItem } from '../types'
import { TEXT_MAP } from '../constants'

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

    const normalizeRepresentativeList = (list: any[]): RepresentativeItem[] => {
        if (!Array.isArray(list)) return []

        return list
            .map((item: any) => ({
                name: item?.name ?? '',
                description: item?.description ?? '',
                image: item?.image ?? ''
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
