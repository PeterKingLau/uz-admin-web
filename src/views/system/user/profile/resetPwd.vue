<template>
    <div class="reset-pwd-form">
        <el-form ref="pwdRef" :model="form" :rules="rules" label-position="top" class="custom-form">
            <el-row :gutter="24">
                <el-col :span="24">
                    <el-form-item label="旧密码" prop="oldPassword">
                        <div class="field-wrapper">
                            <transition name="fade-mode" mode="out-in">
                                <div v-if="activeEditField !== 'oldPassword'" class="info-view" @click="startEditField('oldPassword')">
                                    <div class="view-content">
                                        <Icon icon="ep:key" class="view-icon" />
                                        <span class="view-text">{{ form.oldPassword ? '已填写旧密码' : '点击输入旧密码' }}</span>
                                    </div>
                                    <span class="view-action">点击编辑</span>
                                </div>

                                <div v-else class="info-edit">
                                    <el-input v-model="form.oldPassword" placeholder="请输入旧密码" type="password" show-password>
                                        <template #prefix>
                                            <Icon icon="ep:key" />
                                        </template>
                                    </el-input>
                                    <el-button type="primary" link size="small" class="confirm-btn" @click="finishEditField('oldPassword')"> 确定 </el-button>
                                </div>
                            </transition>
                        </div>
                    </el-form-item>
                </el-col>

                <el-col :span="24">
                    <el-form-item label="新密码" prop="newPassword">
                        <div class="field-wrapper">
                            <transition name="fade-mode" mode="out-in">
                                <div v-if="activeEditField !== 'newPassword'" class="info-view" @click="startEditField('newPassword')">
                                    <div class="view-content">
                                        <Icon icon="ep:lock" class="view-icon" />
                                        <span class="view-text">{{ form.newPassword ? '已填写新密码' : '点击输入新密码' }}</span>
                                    </div>
                                    <span class="view-action">点击编辑</span>
                                </div>

                                <div v-else class="info-edit">
                                    <el-input v-model="form.newPassword" placeholder="请输入新密码" type="password" show-password>
                                        <template #prefix>
                                            <Icon icon="ep:lock" />
                                        </template>
                                    </el-input>
                                    <el-button type="primary" link size="small" class="confirm-btn" @click="finishEditField('newPassword')"> 确定 </el-button>
                                </div>
                            </transition>
                        </div>
                    </el-form-item>
                </el-col>

                <el-col :span="24">
                    <el-form-item label="确认密码" prop="confirmPassword">
                        <div class="field-wrapper">
                            <transition name="fade-mode" mode="out-in">
                                <div v-if="activeEditField !== 'confirmPassword'" class="info-view" @click="startEditField('confirmPassword')">
                                    <div class="view-content">
                                        <Icon icon="ep:circle-check" class="view-icon" />
                                        <span class="view-text">{{ form.confirmPassword ? '已填写确认密码' : '点击输入确认密码' }}</span>
                                    </div>
                                    <span class="view-action">点击编辑</span>
                                </div>

                                <div v-else class="info-edit">
                                    <el-input v-model="form.confirmPassword" placeholder="请确认新密码" type="password" show-password>
                                        <template #prefix>
                                            <Icon icon="ep:circle-check" />
                                        </template>
                                    </el-input>
                                    <el-button type="primary" link size="small" class="confirm-btn" @click="finishEditField('confirmPassword')">
                                        确定
                                    </el-button>
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
defineOptions({ name: 'ViewsSystemUserProfileResetPwd' })
import { ref, reactive, getCurrentInstance } from 'vue'
import { updateUserPwd } from '@/api/system/user'

const { proxy } = getCurrentInstance()
const pwdRef = ref(null)
const loading = ref(false)
const activeEditField = ref('')

const form = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const equalToPassword = (rule, value, callback) => {
    if (!value) {
        callback(new Error('确认密码不能为空'))
        return
    }
    if (form.newPassword !== value) {
        callback(new Error('两次输入的密码不一致'))
    } else {
        callback()
    }
}

const rules = {
    oldPassword: [{ required: true, message: '旧密码不能为空', trigger: 'blur' }],
    newPassword: [
        { required: true, message: '新密码不能为空', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
        { pattern: /^[^<>"'|\\]+$/, message: '不能包含非法字符：< > " \' \\ |', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '确认密码不能为空', trigger: 'blur' },
        { validator: equalToPassword, trigger: ['blur', 'change'] }
    ]
}

function startEditField(field) {
    activeEditField.value = field
}

function finishEditField(field) {
    if (activeEditField.value !== field) return
    activeEditField.value = ''
}

function submit() {
    if (!pwdRef.value) return

    pwdRef.value.validate(valid => {
        if (!valid) return

        loading.value = true
        updateUserPwd(form.oldPassword, form.newPassword)
            .then(() => {
                proxy.$modal?.msgSuccess && proxy.$modal.msgSuccess('修改成功')
                form.oldPassword = ''
                form.newPassword = ''
                form.confirmPassword = ''
                activeEditField.value = ''
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
.reset-pwd-form {
    padding-top: 10px;
    max-width: 500px;
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

.field-wrapper {
    min-height: 40px;
}

.info-view {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 40px;
    padding: 0 12px;
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background-color: var(--el-fill-color-lighter);
    gap: 12px;

    &:hover {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
    }

    .view-content {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        flex: 1;
    }

    .view-icon {
        font-size: 16px;
        line-height: 1;
        color: var(--el-text-color-secondary);
        flex-shrink: 0;
    }

    .view-text {
        font-size: 14px;
        line-height: 1.5;
        color: var(--el-text-color-primary);
    }

    .view-action {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        opacity: 0.7;
        transition: all 0.2s;
        flex-shrink: 0;
    }
}

.info-edit {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;

    :deep(.el-input) {
        flex: 1;
    }
}

.confirm-btn {
    font-size: 14px;
    padding: 0 8px;
    flex-shrink: 0;
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
