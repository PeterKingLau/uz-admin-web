<template>
    <div class="user-info-form">
        <el-form ref="userRef" :model="form" :rules="rules" label-position="top" class="custom-form">
            <el-row :gutter="24">
                <el-col :span="12" :xs="24">
                    <el-form-item label="用户昵称" prop="nickName">
                        <el-input v-model="form.nickName" maxlength="30" placeholder="请输入您的昵称">
                            <template #prefix>
                                <Icon icon="ep:user" />
                            </template>
                        </el-input>
                    </el-form-item>
                </el-col>

                <el-col :span="12" :xs="24">
                    <el-form-item label="手机号码" prop="phonenumber">
                        <el-input v-model="form.phonenumber" maxlength="11" placeholder="请输入手机号码">
                            <template #prefix>
                                <Icon icon="ep:iphone" />
                            </template>
                        </el-input>
                    </el-form-item>
                </el-col>

                <el-col :span="12" :xs="24">
                    <el-form-item label="邮箱地址" prop="email">
                        <el-input v-model="form.email" maxlength="50" placeholder="请输入邮箱地址">
                            <template #prefix>
                                <Icon icon="ep:message" />
                            </template>
                        </el-input>
                    </el-form-item>
                </el-col>

                <el-col :span="12" :xs="24">
                    <el-form-item label="性别">
                        <div class="gender-group">
                            <el-radio-group v-model="form.sex">
                                <el-radio-button label="0">男</el-radio-button>
                                <el-radio-button label="1">女</el-radio-button>
                            </el-radio-group>
                        </div>
                    </el-form-item>
                </el-col>
            </el-row>

            <div class="form-footer">
                <el-button type="primary" :loading="loading" @click="submit" class="action-btn"> <Icon icon="ep:check" class="mr-1" /> 保存修改 </el-button>
                <el-button type="danger" plain @click="close" class="action-btn"> <Icon icon="ep:close" class="mr-1" /> 关闭 </el-button>
            </div>
        </el-form>
    </div>
</template>

<script setup>
import { ref, watch, getCurrentInstance } from 'vue'
import { updateUserProfile } from '@/api/system/user'
import { Icon } from '@iconify/vue'

const props = defineProps({
    user: {
        type: Object,
        default: () => ({})
    }
})

const { proxy } = getCurrentInstance()
const userRef = ref(null)
const loading = ref(false)

const form = ref({
    nickName: '',
    phonenumber: '',
    email: '',
    sex: '0'
})

const rules = {
    nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
    email: [
        { required: true, message: '邮箱地址不能为空', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
    ],
    phonenumber: [
        { required: true, message: '手机号码不能为空', trigger: 'blur' },
        { pattern: /^1[3-9][0-9]\d{8}$/, message: '请输入正确的手机号码', trigger: 'blur' }
    ]
}

watch(
    () => props.user,
    user => {
        if (!user) return
        form.value = {
            nickName: user.nickName || '',
            phonenumber: user.phonenumber || '',
            email: user.email || '',
            sex: user.sex ?? '0'
        }
    },
    { immediate: true, deep: true }
)

function submit() {
    if (!userRef.value) return

    userRef.value.validate(valid => {
        if (!valid) return

        loading.value = true
        updateUserProfile(form.value)
            .then(() => {
                proxy.$modal?.msgSuccess && proxy.$modal.msgSuccess('修改成功')
                if (props.user) {
                    Object.assign(props.user, form.value)
                }
            })
            .finally(() => {
                loading.value = false
            })
    })
}

function close() {
    proxy.$tab.closePage()
}
</script>

<style scoped lang="scss">
.user-info-form {
    padding-top: 10px;
    max-width: 800px;
}

.custom-form {
    :deep(.el-form-item__label) {
        font-weight: 500;
        color: var(--el-text-color-regular);
        padding-bottom: 8px;
    }

    :deep(.el-input__wrapper) {
        box-shadow: 0 0 0 1px var(--el-border-color) inset;
        padding: 8px 11px;
        border-radius: 8px;
        transition: all 0.2s;

        &:hover,
        &.is-focus {
            box-shadow: 0 0 0 1px var(--el-color-primary) inset;
        }
    }
}

.gender-group {
    :deep(.el-radio-button__inner) {
        padding: 10px 24px;
        border-radius: 8px;
        border: 1px solid var(--el-border-color);
        box-shadow: none !important;
        margin-right: 10px;
    }

    :deep(.el-radio-button:first-child .el-radio-button__inner) {
        border-left: 1px solid var(--el-border-color);
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        border-color: var(--el-color-primary);
    }
}

.form-footer {
    margin-top: 32px;
    display: flex;
    gap: 16px;

    .action-btn {
        padding: 12px 32px;
        border-radius: 8px;
        font-weight: 500;
        height: auto;
    }
}
</style>
