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
                        <div class="gender-wrapper">
                            <transition name="fade-mode" mode="out-in">
                                <div v-if="!isEditSex" class="gender-view" @click="isEditSex = true">
                                    <div class="view-content">
                                        <Icon
                                            :icon="form.sex === '0' ? 'ep:male' : 'ep:female'"
                                            class="view-icon"
                                            :class="form.sex === '0' ? 'male' : 'female'"
                                        />
                                        <span class="view-text">{{ form.sex === '0' ? '男' : '女' }}</span>
                                    </div>
                                </div>

                                <div v-else class="gender-edit">
                                    <el-radio-group v-model="form.sex">
                                        <el-radio value="0" border>男</el-radio>
                                        <el-radio value="1" border>女</el-radio>
                                    </el-radio-group>
                                    <el-button type="primary" link size="small" class="confirm-btn" @click="isEditSex = false"> 确定 </el-button>
                                </div>
                            </transition>
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

const props = defineProps({
    user: {
        type: Object,
        default: () => ({})
    }
})

const { proxy } = getCurrentInstance()
const userRef = ref(null)
const loading = ref(false)
const isEditSex = ref(false)

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

.gender-wrapper {
    height: 40px;
    display: flex;
    align-items: center;
}

.gender-view {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0 12px;
    height: 40px;
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background-color: var(--el-fill-color-lighter);

    &:hover {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
    }

    .view-content {
        display: flex;
        align-items: center;
        gap: 8px;

        .view-icon {
            font-size: 16px;
            line-height: 1;
            &.male {
                color: #409eff;
            }
            &.female {
                color: #f56c6c;
            }
        }

        .view-text {
            font-size: 14px;
            line-height: 1;
            color: var(--el-text-color-primary);
        }
    }

    .view-action {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        opacity: 0.6;
        transition: all 0.2s;
    }
}

.gender-edit {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;

    :deep(.el-radio-group) {
        flex: 1;
        display: flex;
    }

    :deep(.el-radio) {
        margin-right: 12px;
        flex: 1;
        height: 40px;
        border-radius: 8px;

        &.is-bordered {
            padding: 0 15px 0 10px;
        }
    }

    .confirm-btn {
        font-size: 14px;
        padding: 0 8px;
    }
}

.fade-mode-enter-active,
.fade-mode-leave-active {
    transition: opacity 0.2s ease;
}

.fade-mode-enter-from,
.fade-mode-leave-to {
    opacity: 0;
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
