<template>
    <div class="login">
        <el-form ref="loginRef" :model="loginForm" :rules="activeRules" :validate-on-rule-change="false" class="login-form">
            <h3 class="title">用户登录</h3>

            <el-form-item class="login-type-item" style="margin-bottom: 16px">
                <el-radio-group v-model="loginForm.loginType" size="small" class="login-type-switch">
                    <el-radio-button value="PASSWORD" label="账号密码" />
                    <el-radio-button value="SMS" label="短信验证码" />
                </el-radio-group>
            </el-form-item>

            <el-form-item prop="username">
                <el-input
                    v-model="loginForm.username"
                    type="text"
                    size="large"
                    autocomplete="off"
                    :placeholder="usernamePlaceholder"
                    :validate-event="false"
                    :maxlength="usernameMaxlength"
                    :inputmode="loginForm.loginType === 'SMS' ? 'numeric' : 'text'"
                    @input="handleUsernameInput"
                    @keyup.enter="handleLogin"
                >
                    <template #prefix>
                        <svg-icon icon-class="ep:user" class="el-input__icon input-icon" />
                    </template>
                </el-input>
            </el-form-item>

            <el-form-item v-if="loginForm.loginType === 'PASSWORD'" prop="password">
                <el-input
                    v-model="loginForm.password"
                    :type="showPassword ? 'text' : 'password'"
                    size="large"
                    autocomplete="off"
                    placeholder="请输入您的密码"
                    :validate-event="false"
                    @keyup.enter="handleLogin"
                >
                    <template #prefix>
                        <svg-icon icon-class="mdi:lock" class="el-input__icon input-icon" />
                    </template>
                    <template #suffix>
                        <Icon :icon="showPassword ? 'mdi:eye-off' : 'mdi:eye'" class="el-input__icon password-toggle" @click.stop="togglePassword" />
                    </template>
                </el-input>
            </el-form-item>

            <!-- 短信验证码（仅 SMS） -->
            <el-form-item v-if="loginForm.loginType === 'SMS'" prop="smsCode">
                <div class="sms-input-group">
                    <el-input
                        v-model="loginForm.smsCode"
                        maxlength="6"
                        size="large"
                        placeholder="短信验证码"
                        :validate-event="false"
                        @keyup.enter="handleLogin"
                        class="sms-input"
                    >
                        <template #prefix>
                            <svg-icon icon-class="ep:message" class="el-input__icon input-icon" />
                        </template>
                    </el-input>

                    <el-button class="sms-btn" type="primary" :disabled="smsSending || smsCountdown > 0" @click="sendSms">
                        {{ smsCountdown > 0 ? smsCountdown + 's' : '获取' }}
                    </el-button>
                </div>
            </el-form-item>

            <!-- 记住密码（仅 PASSWORD） -->
            <el-checkbox v-if="loginForm.loginType === 'PASSWORD'" v-model="loginForm.rememberMe" class="remember-me"> 记住密码 </el-checkbox>

            <el-form-item style="width: 100%; margin-bottom: 0">
                <el-button :loading="loading" size="large" type="primary" class="login-btn" @click.prevent="handleLogin">
                    <span v-if="!loading">登 录</span>
                    <span v-else>登录中</span>
                </el-button>

                <div v-if="register" class="register-link">
                    <router-link class="link-type" :to="'/register'">立即注册</router-link>
                </div>
            </el-form-item>
        </el-form>

        <!-- 底部 -->
        <div class="el-login-footer">
            <span>Copyright © 2018-2025 All Rights Reserved.</span>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import Cookies from 'js-cookie'
import { encrypt, decrypt } from '@/utils/jsencrypt'
import useUserStore from '@/store/modules/user'
import { sendPhoneCode } from '@/api/login/login'

const title = import.meta.env.VITE_APP_TITLE
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const loginRef = ref()

const loginForm = ref({
    loginType: 'PASSWORD',
    username: '',
    password: '',
    smsCode: '',
    rememberMe: false
})

// 动态校验
const activeRules = computed(() => {
    const rules = {
        username: [{ required: true, trigger: 'blur', message: usernamePlaceholder.value }]
    }

    if (loginForm.value.loginType === 'PASSWORD') {
        rules.password = [{ required: true, trigger: 'blur', message: '请输入您的密码' }]
    }

    if (loginForm.value.loginType === 'SMS') {
        // 手机号格式 + 验证码
        rules.username = [
            { required: true, message: '请输入手机号', trigger: 'blur' },
            {
                pattern: /^1[3-9]\d{9}$/,
                message: '请输入正确的手机号',
                trigger: ['blur', 'change']
            }
        ]
        rules.smsCode = [
            { required: true, message: '请输入短信验证码', trigger: 'blur' },
            {
                pattern: /^\d{4,6}$/,
                message: '验证码格式不正确',
                trigger: ['blur', 'change']
            }
        ]
    }

    return rules
})

// 仅在短信登录时：限制为数字、最长11位
const usernameMaxlength = computed(() => (loginForm.value.loginType === 'SMS' ? 11 : 50))

function handleUsernameInput(val) {
    if (loginForm.value.loginType === 'SMS') {
        const cleaned = String(val).replace(/\D/g, '').slice(0, 11)
        loginForm.value.username = cleaned
    } else {
        loginForm.value.username = val
    }
}

const usernamePlaceholder = computed(() => (loginForm.value.loginType === 'SMS' ? '请输入手机号' : '请输入您的账号'))

const loading = ref(false)
const register = ref(false)
const redirect = ref()

// 切换类型
watch(
    () => loginForm.value.loginType,
    val => {
        if (val === 'SMS') {
            loginForm.value.username = ''
            loginForm.value.password = ''
            loginForm.value.rememberMe = false
        } else if (val === 'PASSWORD') {
            loginForm.value.smsCode = ''
            smsCountdown.value = 0
        }
    }
)

// 切换类型时清理
watch(
    () => loginForm.value.loginType,
    async () => {
        if (loginForm.value.loginType === 'SMS') {
            loginForm.value.username = ''
            loginForm.value.password = ''
            loginForm.value.rememberMe = false
        } else {
            loginForm.value.smsCode = ''
            smsCountdown.value = 0
        }
        await nextTick()
        loginRef.value?.clearValidate?.(['username', 'password', 'smsCode'])
    }
)

// 短信逻辑
const smsSending = ref(false)
const smsCountdown = ref(0)

// 发送验证码
async function sendSms() {
    const phone = loginForm.value.username
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        ElMessage.warning('请输入正确的手机号')
        return
    }
    if (smsCountdown.value > 0 || smsSending.value) return

    smsSending.value = true
    try {
        await sendPhoneCode(loginForm.value.username)
        ElMessage.success('验证码已发送')
        smsCountdown.value = 60
        const timer = setInterval(() => {
            smsCountdown.value--
            if (smsCountdown.value <= 0) clearInterval(timer)
        }, 1000)
    } catch (err) {
        ElMessage.error('发送失败，请稍后重试')
    } finally {
        smsSending.value = false
    }
}

onMounted(() => {
    // 仅在密码登录下恢复“记住密码”
    const username = Cookies.get('username')
    const password = Cookies.get('password')
    const rememberMe = Cookies.get('rememberMe')
    loginForm.value.username = username ?? loginForm.value.username
    if (rememberMe) {
        loginForm.value.password = password ? decrypt(password) : loginForm.value.password
        loginForm.value.rememberMe = Boolean(rememberMe)
    }
})

const cleanUsername = val => (val || '').replace(/^[\s\u3000]+|[\s\u3000]+$/g, '')
const cleanSmsCode = val => (val || '').replace(/[\s\u3000]+/g, '')

function normalizeLoginFields() {
    loginForm.value.username = cleanUsername(loginForm.value.username)

    if (loginForm.value.loginType === 'SMS') {
        loginForm.value.smsCode = cleanSmsCode(loginForm.value.smsCode)
    }
}

function handleLogin() {
    normalizeLoginFields()

    loginRef.value.validate(valid => {
        if (!valid) return
        loading.value = true

        // Cookie 只在密码登录时处理
        if (loginForm.value.loginType === 'PASSWORD' && loginForm.value.rememberMe) {
            Cookies.set('username', loginForm.value.username, { expires: 30 })
            Cookies.set('password', encrypt(loginForm.value.password), {
                expires: 30
            })
            Cookies.set('rememberMe', loginForm.value.rememberMe, { expires: 30 })
        } else {
            Cookies.remove('username')
            Cookies.remove('password')
            Cookies.remove('rememberMe')
        }

        const payload = {
            loginType: loginForm.value.loginType,
            username: (loginForm.value.username || '').trim()
        }
        if (loginForm.value.loginType === 'PASSWORD' && loginForm.value.password) {
            payload.password = loginForm.value.password
        }
        if (loginForm.value.loginType === 'SMS' && loginForm.value.smsCode) {
            payload.smsCode = loginForm.value.smsCode
        }

        userStore
            .login(payload)
            .then(() => {
                const query = route.query
                const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
                    if (cur !== 'redirect') acc[cur] = query[cur]
                    return acc
                }, {})
                router.push({ path: redirect.value || '/', query: otherQueryParams })
            })
            .catch(() => {
                loading.value = false
            })
    })
}
const showPassword = ref(false)

function togglePassword() {
    showPassword.value = !showPassword.value
}
</script>

<style lang="scss" scoped>
.login {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 24px;
    /* 背景：偏蓝的渐变 + 你的背景图 */
    background-color: #e6f1ff;
    background-image: url('../assets/images/login-background.jpg');
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        /* 更接近截图的柔和高光效果 */
        background: radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.9), rgba(135, 182, 255, 0.25));
        backdrop-filter: blur(3px);
        z-index: 0;
    }
}

.title {
    margin: 0 auto 18px auto;
    text-align: center;
    color: #333;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 2px;
}

.login-form {
    position: relative;
    z-index: 1;
    width: 420px;
    padding: 32px 36px 24px;
    border-radius: 24px;
    background: #ffffff;
    box-shadow:
        0 18px 35px rgba(0, 0, 0, 0.12),
        0 0 0 1px rgba(255, 255, 255, 0.9);

    :deep(.el-form-item) {
        margin-bottom: 18px;
    }

    :deep(.login-type-item .el-form-item__content) {
        display: flex;
        justify-content: center;
    }

    .login-type-switch {
        display: inline-flex;
        background: #f2f4f8;
        border-radius: 999px;
        padding: 3px;
    }

    .login-type-switch :deep(.el-radio-button__inner) {
        border: none !important;
        background: transparent;
        box-shadow: none !important;
        padding: 6px 20px;
        border-radius: 999px;
        color: #606266;
        transition: all 0.2s ease;
        font-size: 13px;
    }

    .login-type-switch :deep(.is-active .el-radio-button__inner) {
        background: #409eff;
        color: #fff !important;
    }

    :deep(.el-input__wrapper) {
        background-color: #f9fbff;
        box-shadow: 0 0 0 1px #e4e7ed;
        border-radius: 8px;
    }

    :deep(.el-input__wrapper.is-focus) {
        box-shadow:
            0 0 0 1px var(--el-color-primary),
            0 0 0 3px rgba(64, 158, 255, 0.12);
        background-color: #ffffff;
    }

    .el-input {
        height: 40px;
        input {
            height: 40px;
        }
    }

    .input-icon {
        height: 40px;
        width: 16px;
        margin-left: 2px;
        color: #c0c4cc;
    }

    .login-type-switch {
        display: inline-flex;
        background: #f2f4f8;
        border-radius: 999px;
        padding: 3px;
    }

    .login-type-switch :deep(.el-radio-button__inner) {
        border: none !important;
        background: transparent;
        box-shadow: none !important;
        padding: 6px 20px;
        border-radius: 999px;
        color: #606266;
        transition: all 0.2s ease;
        font-size: 13px;
    }

    .login-type-switch :deep(.is-active .el-radio-button__inner) {
        background: #409eff;
        color: #fff !important;
    }

    .remember-me {
        margin: 4px 0 18px 0;
        font-size: 13px;
        color: #666;
    }

    .login-btn {
        width: 100%;
        margin-top: 6px;
        border-radius: 999px;
        font-size: 14px;
        letter-spacing: 6px;
    }

    :deep(.el-button--primary span) {
        letter-spacing: 6px;
    }

    .register-link {
        margin-top: 8px;
        text-align: right;
        font-size: 13px;
    }
}

.el-login-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    line-height: 40px;
    text-align: center;
    color: rgba(255, 255, 255, 0.9);
    font-family: Arial;
    font-size: 12px;
    letter-spacing: 1px;
    z-index: 1;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

.password-toggle {
    cursor: pointer;
    font-size: 18px;
    transition: all 0.2s ease;
}

.password-toggle:hover {
    color: var(--el-color-primary);
    transform: scale(1.05);
}

/* 短信输入 + 按钮：保持简洁，又不卡视觉 */
.sms-input-group {
    display: flex;
    align-items: stretch;
    width: 100%;
}

/* 左侧输入框：右侧边去掉，留给按钮 */
.login-form :deep(.sms-input .el-input__wrapper) {
    border-radius: 8px 0 0 8px !important;
    box-shadow: 0 0 0 1px #e4e7ed;
    border-right: none;
}

/* 聚焦时整组高亮感保持一致 */
.login-form :deep(.sms-input .el-input__wrapper.is-focus) {
    box-shadow:
        0 0 0 1px var(--el-color-primary),
        0 0 0 3px rgba(64, 158, 255, 0.12);
}

/* 右侧按钮：贴边圆角、尺寸更接近截图按钮风格 */
.sms-btn {
    border-radius: 0 8px 8px 0;
    margin-left: 0;
    border-left: none;
    height: 40px;
    padding: 0 14px;
    font-size: 12px;
    letter-spacing: 0;
    line-height: 1;
}

/* 小屏适配 */
@media (max-width: 768px) {
    .login {
        padding: 16px;
        align-items: flex-start;
    }
    .login-form {
        width: 100%;
        max-width: 380px;
        margin-top: 40px;
        padding: 26px 22px 18px;
        box-shadow:
            0 12px 30px rgba(0, 0, 0, 0.18),
            0 0 0 1px rgba(255, 255, 255, 0.9);
    }
}
</style>
