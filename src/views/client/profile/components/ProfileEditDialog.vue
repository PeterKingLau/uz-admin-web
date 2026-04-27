<template>
    <el-dialog
        :model-value="modelValue"
        title="编辑资料"
        width="520px"
        append-to-body
        destroy-on-close
        class="client-profile-edit-dialog"
        @update:model-value="handleVisibleChange"
        @closed="resetForm"
    >
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="profile-edit-form">
            <el-form-item label="昵称" prop="nickName">
                <el-input v-model="form.nickName" maxlength="30" show-word-limit placeholder="填写你的昵称" />
            </el-form-item>

            <el-form-item label="简介" prop="remark">
                <el-input v-model="form.remark" type="textarea" maxlength="120" show-word-limit :rows="4" resize="none" placeholder="介绍一下自己" />
            </el-form-item>

            <div class="form-grid">
                <el-form-item label="手机号" prop="phonenumber">
                    <el-input v-model="form.phonenumber" maxlength="11" placeholder="可选" />
                </el-form-item>

                <el-form-item label="邮箱" prop="email">
                    <el-input v-model="form.email" maxlength="50" placeholder="可选" />
                </el-form-item>
            </div>

            <el-form-item label="性别">
                <el-segmented v-model="form.sex" class="gender-segmented" :options="genderOptions" />
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="dialog-actions">
                <button type="button" class="dialog-btn ghost" :disabled="saving" @click="handleVisibleChange(false)">取消</button>
                <button type="button" class="dialog-btn primary" :disabled="saving" @click="submit">
                    <Icon v-if="saving" icon="mdi:loading" class="spin" />
                    <span>{{ saving ? '保存中' : '保存' }}</span>
                </button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsClientProfileComponentsProfileEditDialog' })
import { computed, getCurrentInstance, reactive, ref, watch } from 'vue'
import { updateUserProfile } from '@/api/system/user'
import useUserStore from '@/store/modules/user'

const props = defineProps<{
    modelValue: boolean
    profile: Record<string, any>
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'saved', value: Record<string, any>): void
}>()

const userStore = useUserStore()
const { proxy } = getCurrentInstance() || {}
const formRef = ref<any>()
const saving = ref(false)

const form = reactive({
    nickName: '',
    remark: '',
    phonenumber: '',
    email: '',
    sex: '2'
})

const genderOptions = [
    { label: '男', value: '0' },
    { label: '女', value: '1' },
    { label: '保密', value: '2' }
]

const emailValidator = (_rule: any, value: string, callback: (error?: Error) => void) => {
    const text = String(value || '').trim()
    if (!text || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
        callback()
        return
    }
    callback(new Error('请输入正确的邮箱地址'))
}

const phoneValidator = (_rule: any, value: string, callback: (error?: Error) => void) => {
    const text = String(value || '').trim()
    if (!text || /^1[3-9]\d{9}$/.test(text)) {
        callback()
        return
    }
    callback(new Error('请输入正确的手机号'))
}

const rules = {
    nickName: [{ required: true, message: '昵称不能为空', trigger: 'blur' }],
    email: [{ validator: emailValidator, trigger: ['blur', 'change'] }],
    phonenumber: [{ validator: phoneValidator, trigger: ['blur', 'change'] }]
}

const sourceProfile = computed(() => props.profile || {})

const syncForm = () => {
    const profile = sourceProfile.value
    form.nickName = String(profile.nickName || profile.nickname || userStore.nickName || userStore.name || '').trim()
    form.remark = String(profile.signature || profile.remark || '').trim()
    form.phonenumber = String(profile.phonenumber || profile.phone || '').trim()
    form.email = String(profile.email || '').trim()
    form.sex = String(profile.sex ?? '2')
}

const resetForm = () => {
    formRef.value?.clearValidate?.()
    syncForm()
}

const handleVisibleChange = (value: boolean) => {
    emit('update:modelValue', value)
}

const submit = async () => {
    if (saving.value) return
    const valid = await formRef.value?.validate?.().catch(() => false)
    if (!valid) return

    const payload = {
        nickName: form.nickName.trim(),
        remark: form.remark.trim(),
        signature: form.remark.trim(),
        phonenumber: form.phonenumber.trim(),
        email: form.email.trim(),
        sex: form.sex
    }

    saving.value = true
    try {
        await updateUserProfile(payload)
        userStore.patchUserSnapshot(payload)
        try {
            await userStore.refreshProfile()
        } catch {
            // 页面会用本次提交的数据先行更新，刷新失败不阻塞用户保存结果。
        }
        proxy?.$modal?.msgSuccess?.('资料已更新')
        emit('saved', payload)
        emit('update:modelValue', false)
    } finally {
        saving.value = false
    }
}

watch(
    () => props.modelValue,
    value => {
        if (value) syncForm()
    },
    { immediate: true }
)

watch(
    () => props.profile,
    () => {
        if (props.modelValue) syncForm()
    },
    { deep: true }
)
</script>

<style scoped lang="scss">
.profile-edit-form {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

.gender-segmented {
    width: 100%;
}

.dialog-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
}

.dialog-btn {
    height: 36px;
    min-width: 82px;
    border: 0;
    border-radius: 999px;
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition:
        background-color var(--app-motion-fast),
        color var(--app-motion-fast),
        opacity var(--app-motion-fast);

    &:disabled {
        cursor: default;
        opacity: 0.6;
    }
}

.dialog-btn.primary {
    background: var(--primary-gradient);
    color: var(--client-primary-contrast);
}

.dialog-btn.ghost {
    background: var(--client-surface-muted);
    color: var(--text-regular);
}

.dialog-btn.ghost:hover:not(:disabled) {
    background: var(--client-surface-hover);
    color: var(--text-main);
}

.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@media screen and (max-width: 640px) {
    .form-grid {
        grid-template-columns: 1fr;
        gap: 0;
    }
}
</style>

<style lang="scss">
.client-profile-edit-dialog {
    border-radius: 16px !important;
    background: var(--client-surface) !important;
    overflow: hidden;

    .el-dialog__header {
        padding: 22px 24px 10px;
        margin: 0;
    }

    .el-dialog__title {
        color: var(--text-main);
        font-size: 18px;
        font-weight: 800;
    }

    .el-dialog__body {
        padding: 10px 24px 4px;
    }

    .el-dialog__footer {
        padding: 14px 24px 22px;
    }

    .el-form-item__label {
        color: var(--text-regular);
        font-weight: 700;
        line-height: 1.4;
        padding-bottom: 8px;
    }

    .el-input__wrapper,
    .el-textarea__inner {
        border-radius: 10px;
        background: var(--client-fill);
        box-shadow: none;
        border: 1px solid transparent;
        transition:
            background-color var(--app-motion-fast),
            border-color var(--app-motion-fast),
            box-shadow var(--app-motion-fast);
    }

    .el-input__wrapper:hover,
    .el-textarea__inner:hover {
        background: var(--client-fill-hover);
    }

    .el-input__wrapper.is-focus,
    .el-textarea__inner:focus {
        background: var(--client-surface);
        border-color: var(--primary-color);
        box-shadow: var(--client-field-focus-ring);
    }

    .el-input__inner,
    .el-textarea__inner {
        color: var(--text-main);
    }

    .el-input__inner::placeholder,
    .el-textarea__inner::placeholder {
        color: var(--text-minor);
    }

    .gender-segmented.el-segmented {
        --el-segmented-bg-color: var(--client-fill);
        --el-segmented-item-selected-bg-color: var(--client-surface);
        --el-segmented-item-selected-color: var(--primary-color);
        --el-segmented-item-hover-bg-color: var(--client-fill-hover);
        --el-segmented-item-hover-color: var(--text-main);

        width: 100%;
        padding: 4px;
        border-radius: 12px;
    }

    .gender-segmented .el-segmented__item {
        border-radius: 9px;
    }
}
</style>
