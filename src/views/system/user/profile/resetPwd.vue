<template>
    <div class="reset-pwd-form">
        <el-form ref="pwdRef" :model="form" :rules="rules" label-position="top" class="custom-form">
            <el-row :gutter="24">
                <el-col :span="24">
                    <el-form-item label="旧密码" prop="oldPassword">
                        <el-input v-model="form.oldPassword" placeholder="请输入旧密码" type="password" show-password>
                            <template #prefix>
                                <Icon icon="ep:key" />
                            </template>
                        </el-input>
                    </el-form-item>
                </el-col>

                <el-col :span="24">
                    <el-form-item label="新密码" prop="newPassword">
                        <el-input v-model="form.newPassword" placeholder="请输入新密码" type="password" show-password>
                            <template #prefix>
                                <Icon icon="ep:lock" />
                            </template>
                        </el-input>
                    </el-form-item>
                </el-col>

                <el-col :span="24">
                    <el-form-item label="确认密码" prop="confirmPassword">
                        <el-input v-model="form.confirmPassword" placeholder="请确认新密码" type="password" show-password>
                            <template #prefix>
                                <Icon icon="ep:circle-check" />
                            </template>
                        </el-input>
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
import { ref, reactive, getCurrentInstance } from 'vue'
import { updateUserPwd } from '@/api/system/user'

const { proxy } = getCurrentInstance()
const pwdRef = ref(null)
const loading = ref(false)

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
