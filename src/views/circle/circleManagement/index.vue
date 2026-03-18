<template>
    <CreatePageShell
        title="创建新圈子"
        subtitle="填写基础信息，开启你的社区空间"
        :gutter="60"
        :max-width="''"
        :left-md="24"
        :left-lg="14"
        :left-xl="14"
        :right-md="24"
        :right-lg="10"
        :right-xl="10"
    >
        <template #primary>
            <CircleEditorPanel
                ref="editorPanelRef"
                :form="form"
                :rules="rules"
                :submitting="submitting"
                :cover-uploading="coverUploading"
                @cover-uploading-change="handleCoverUploadingChange"
                @submit="handleSubmit"
                @reset="handleReset"
            />
        </template>

        <template #secondary>
            <CirclePreviewPanel
                :name="form.name"
                :description="form.description"
                :cover-preview-url="coverPreviewUrl"
                :mock-member-count="mockMemberCount"
                :mock-post-count="mockPostCount"
                :user-avatar="userAvatar"
                :user-nick-name="userNickName"
            />
        </template>
    </CreatePageShell>
</template>

<script setup lang="ts" name="CircleManagementCreate">
import { computed, getCurrentInstance, reactive, ref } from 'vue'
import type { FormRules } from 'element-plus'
import { createCircle } from '@/api/content/circleManagement'
import type { CreateCirclePayload } from '@/api/content/circleManagement.types'
import { getImgUrl } from '@/utils/img'
import { formatMockNumber } from '@/utils/utils'
import useUserStore from '@/store/modules/user'
import defaultAvatar from '@/assets/images/default-avatar.svg'
import CreatePageShell from '@/components/CreatePageShell/index.vue'
import CircleEditorPanel from './components/CircleEditorPanel.vue'
import CirclePreviewPanel from './components/CirclePreviewPanel.vue'

interface CircleEditorPanelExpose {
    validate: () => Promise<boolean>
    clearValidate: () => void
}

const { proxy } = getCurrentInstance() || {}
const userStore = useUserStore()

const initialForm = () => ({
    name: '',
    description: '',
    coverUrl: ''
})

const editorPanelRef = ref<CircleEditorPanelExpose>()
const form = reactive<CreateCirclePayload>(initialForm())
const submitting = ref(false)
const coverUploading = ref(false)
const coverPreviewUrl = computed(() => getImgUrl(form.coverUrl || ''))
const mockMemberCount = ref(formatMockNumber(800, 5200))
const mockPostCount = ref(formatMockNumber(120, 980))
const userAvatar = computed(() => userStore.avatar || defaultAvatar)
const userNickName = computed(() => userStore.nickName || userStore.name || '我的圈子')

const rules: FormRules = {
    name: [
        { required: true, message: '请输入圈子名称', trigger: 'blur' },
        { min: 2, max: 20, message: '名称长度需在 2-20 个字符之间', trigger: 'blur' }
    ],
    description: [
        { required: true, message: '请填写圈子简介', trigger: 'blur' },
        { min: 5, max: 200, message: '简介长度需在 5-200 个字符之间', trigger: 'blur' }
    ],
    coverUrl: [{ required: true, message: '请上传封面图', trigger: 'change' }]
}

const handleReset = () => {
    editorPanelRef.value?.clearValidate()
    Object.assign(form, initialForm())
    coverUploading.value = false
}

const handleCoverUploadingChange = (value: boolean) => {
    coverUploading.value = Boolean(value)
}

const handleSubmit = async () => {
    if (submitting.value) return

    const ok = (await editorPanelRef.value?.validate()) ?? false
    if (!ok) return

    submitting.value = true
    try {
        await createCircle({
            name: form.name.trim(),
            description: form.description.trim(),
            coverUrl: form.coverUrl.trim()
        })
        proxy?.$modal?.msgSuccess?.('圈子创建成功！')
        handleReset()
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('创建失败，请稍后重试')
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped lang="scss"></style>
