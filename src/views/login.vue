<template>
    <div class="login">
        <el-form ref="loginRef" :model="loginForm" :rules="activeRules" :validate-on-rule-change="false" class="login-form animate-in">
            <div class="header-box">
                <h3 class="title">欢迎回来</h3>
                <p class="sub-title">请登录您的账户以继续</p>
            </div>

            <el-form-item class="login-type-item">
                <div class="login-type-switch">
                    <div class="switch-active-bar" :style="{ transform: loginForm.loginType === 'PASSWORD' ? 'translateX(0)' : 'translateX(100%)' }"></div>
                    <div class="switch-item" :class="{ active: loginForm.loginType === 'PASSWORD' }" @click="loginForm.loginType = 'PASSWORD'">账号密码</div>
                    <div class="switch-item" :class="{ active: loginForm.loginType === 'SMS' }" @click="loginForm.loginType = 'SMS'">短信验证码</div>
                </div>
            </el-form-item>

            <el-form-item prop="username">
                <el-input
                    v-model="loginForm.username"
                    type="text"
                    autocomplete="off"
                    :placeholder="usernamePlaceholder"
                    :maxlength="usernameMaxlength"
                    :inputmode="loginForm.loginType === 'SMS' ? 'numeric' : 'text'"
                    @input="handleUsernameInput"
                    @keyup.enter="handleLogin"
                >
                    <template #prefix>
                        <Icon icon="mdi:account-outline" class="input-icon" />
                    </template>
                </el-input>
            </el-form-item>

            <el-form-item v-if="loginForm.loginType === 'PASSWORD'" prop="password">
                <el-input
                    v-model="loginForm.password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="off"
                    placeholder="请输入您的密码"
                    @keyup.enter="handleLogin"
                >
                    <template #prefix>
                        <Icon icon="mdi:lock-outline" class="input-icon" />
                    </template>
                    <template #suffix>
                        <Icon :icon="showPassword ? 'mdi:eye-off' : 'mdi:eye'" class="password-toggle" @click.stop="togglePassword" />
                    </template>
                </el-input>
            </el-form-item>

            <el-form-item v-if="loginForm.loginType === 'SMS'" prop="smsCode">
                <div class="sms-input-group">
                    <el-input v-model="loginForm.smsCode" maxlength="6" placeholder="6位验证码" @keyup.enter="handleLogin" class="sms-input">
                        <template #prefix>
                            <Icon icon="mdi:message-text-outline" class="input-icon" />
                        </template>
                    </el-input>
                    <el-button class="sms-btn" type="primary" plain :disabled="smsSending || smsCountdown > 0" @click="sendSms">
                        {{ smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码' }}
                    </el-button>
                </div>
            </el-form-item>

            <div class="form-options">
                <el-checkbox v-if="loginForm.loginType === 'PASSWORD'" v-model="loginForm.rememberMe" label="记住我" />
                <router-link v-if="register" to="/register" class="register-link"> 注册新账号 </router-link>
            </div>

            <el-form-item style="margin-bottom: 0">
                <el-button :loading="loading" type="primary" class="login-btn" @click.prevent="handleLogin">
                    {{ loading ? '登录中...' : '立即登录' }}
                </el-button>
            </el-form-item>
        </el-form>

        <div class="el-login-footer">
            <span>Copyright © 2025 All Rights Reserved.</span>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, getCurrentInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import { encrypt, decrypt } from '@/utils/jsencrypt'
import useUserStore from '@/store/modules/user'
import { sendPhoneCode } from '@/api/login/login'

const title = import.meta.env.VITE_APP_TITLE
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance() || {}

const loginRef = ref()

const loginForm = ref({
    loginType: 'PASSWORD',
    username: '',
    password: '',
    smsCode: '',
    rememberMe: false
})

const activeRules = computed(() => {
    const rules = {
        username: [{ required: true, trigger: 'blur', message: usernamePlaceholder.value }]
    }

    if (loginForm.value.loginType === 'PASSWORD') {
        rules.password = [{ required: true, trigger: 'blur', message: '请输入您的密码' }]
    }

    if (loginForm.value.loginType === 'SMS') {
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

watch(
    () => loginForm.value.loginType,
    async val => {
        if (val === 'SMS') {
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

const smsSending = ref(false)
const smsCountdown = ref(0)

async function sendSms() {
    const phone = loginForm.value.username
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        proxy?.$modal?.msgWarning?.('请输入正确的手机号')
        return
    }
    if (smsCountdown.value > 0 || smsSending.value) return

    smsSending.value = true
    try {
        await sendPhoneCode(loginForm.value.username)
        proxy?.$modal?.msgSuccess?.('验证码已发送')
        smsCountdown.value = 60
        const timer = setInterval(() => {
            smsCountdown.value--
            if (smsCountdown.value <= 0) clearInterval(timer)
        }, 1000)
    } catch (err) {
        proxy?.$modal?.msgError?.('发送失败，请稍后重试')
    } finally {
        smsSending.value = false
    }
}

onMounted(() => {
    const username = Cookies.get('username')
    const password = Cookies.get('password')
    const rememberMe = Cookies.get('rememberMe')
    loginForm.value.username = username ?? loginForm.value.username
    if (rememberMe) {
        loginForm.value.password = password ? decrypt(password) : loginForm.value.password
        loginForm.value.rememberMe = Boolean(rememberMe)
    }
})

function handleLogin() {
    loginForm.value.username = (loginForm.value.username || '').trim()
    if (loginForm.value.loginType === 'SMS') {
        loginForm.value.smsCode = (loginForm.value.smsCode || '').trim()
    }

    loginRef.value.validate(valid => {
        if (!valid) return
        loading.value = true

        if (loginForm.value.loginType === 'PASSWORD' && loginForm.value.rememberMe) {
            Cookies.set('username', loginForm.value.username, { expires: 30 })
            Cookies.set('password', encrypt(loginForm.value.password), { expires: 30 })
            Cookies.set('rememberMe', loginForm.value.rememberMe, { expires: 30 })
        } else {
            Cookies.remove('username')
            Cookies.remove('password')
            Cookies.remove('rememberMe')
        }

        const payload = {
            loginType: loginForm.value.loginType,
            username: loginForm.value.username,
            ...(loginForm.value.loginType === 'PASSWORD' && { password: loginForm.value.password }),
            ...(loginForm.value.loginType === 'SMS' && { smsCode: loginForm.value.smsCode })
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
    width: 100%;
    min-height: 100vh;
    background-image: url('../assets/images/login-background.jpg');
    background-size: cover;
    background-position: center;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: color-mix(in srgb, var(--el-color-black) 25%, transparent);
        z-index: 0;
    }
}

:global(html, body, #app) {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow-x: hidden;
    scrollbar-gutter: auto;
}

.animate-in {
    animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(40px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.login-form {
    position: relative;
    z-index: 10;
    width: 420px;
    padding: 48px 40px;
    background: color-mix(in srgb, var(--el-bg-color) 95%, transparent);
    border-radius: 24px;
    box-shadow:
        0 25px 50px -12px color-mix(in srgb, var(--el-color-black) 15%, transparent),
        0 0 0 1px color-mix(in srgb, var(--el-color-black) 5%, transparent) inset;
    transition: all 0.3s ease;
}

.header-box {
    text-align: center;
    margin-bottom: 32px;

    .title {
        margin: 0;
        font-size: 26px;
        font-weight: 800;
        color: var(--el-text-color-primary);
        letter-spacing: -0.5px;
        transition: color 0.3s;
    }

    .sub-title {
        margin-top: 8px;
        font-size: 14px;
        color: var(--el-text-color-secondary);
        transition: color 0.3s;
    }
}

.login-type-switch {
    position: relative;
    display: flex;
    background: var(--el-fill-color-light);
    padding: 4px;
    border-radius: 12px;
    width: 100%;
    height: 44px;
    transition: background-color 0.3s;

    .switch-active-bar {
        position: absolute;
        top: 4px;
        left: 4px;
        width: calc(50% - 4px);
        height: calc(100% - 8px);
        background: var(--el-bg-color);
        border-radius: 8px;
        box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-black) 8%, transparent);
        transition:
            transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            background-color 0.3s;
        z-index: 1;
    }

    .switch-item {
        position: relative;
        z-index: 2;
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 14px;
        color: var(--el-text-color-secondary);
        cursor: pointer;
        border-radius: 8px;
        transition: color 0.3s;
        font-weight: 500;
        user-select: none;

        &:hover {
            color: var(--el-text-color-regular);
        }
        &.active {
            color: var(--el-color-primary);
            font-weight: 600;
        }
    }
}

:deep(.el-form-item) {
    margin-bottom: 24px;
}

:deep(.login-type-item) {
    margin-bottom: 12px;
}

/* 覆盖输入框样式：使用特定设计而不是全局默认 */
:deep(.el-input__wrapper) {
    background-color: var(--el-fill-color-extra-light);
    box-shadow: none !important;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    padding: 0 16px;
    height: 48px;
    line-height: 48px;
    transition: all 0.3s ease;

    &:hover {
        background-color: var(--el-bg-color);
        border-color: var(--el-border-color-light);
    }

    &.is-focus {
        background-color: var(--el-bg-color);
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.15) !important;
    }
}

:deep(.el-input__inner) {
    height: 48px;
    font-size: 15px;
    font-weight: 500;
    /* 文字颜色现在由全局样式控制，这里只微调字体 */
}

.input-icon {
    font-size: 18px;
    color: var(--el-text-color-placeholder);
    margin-right: 8px;
    transition: color 0.3s;
}

:deep(.el-input__wrapper.is-focus) .input-icon {
    color: var(--el-color-primary);
}

.password-toggle {
    cursor: pointer;
    color: var(--el-text-color-placeholder);
    font-size: 18px;
    transition: color 0.2s;
    margin-right: 8px;
    &:hover {
        color: var(--el-text-color-secondary);
    }
}

.sms-input-group {
    display: flex;
    gap: 12px;
    .sms-input {
        flex: 1;
    }

    .sms-btn {
        height: 48px;
        padding: 0 20px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        background: rgba(var(--el-color-primary-rgb), 0.1);
        border: 1px solid rgba(var(--el-color-primary-rgb), 0.2);
        color: var(--el-color-primary);
        transition: all 0.2s;

        &:hover:not(.is-disabled) {
            background: var(--el-color-primary);
            color: var(--el-color-white);
            border-color: var(--el-color-primary);
        }

        &.is-disabled {
            background: var(--el-fill-color-light);
            border-color: var(--el-border-color-lighter);
            color: var(--el-text-color-placeholder);
        }
    }
}

.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: -8px;
    margin-bottom: 28px;
    padding: 0 4px;

    :deep(.el-checkbox__label) {
        color: var(--el-text-color-secondary);
        font-size: 14px;
    }

    :deep(.el-checkbox__inner) {
        border-radius: 4px;
    }

    .register-link {
        color: var(--el-color-primary);
        font-size: 14px;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;
        &:hover {
            color: var(--el-color-primary-dark-2);
        }
    }
}

.login-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
    border: none;
    box-shadow: 0 10px 20px -5px rgba(var(--el-color-primary-rgb), 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 15px 25px -5px rgba(var(--el-color-primary-rgb), 0.5);
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 5px 15px -5px rgba(var(--el-color-primary-rgb), 0.4);
    }
}

.el-login-footer {
    position: fixed;
    bottom: 24px;
    width: 100%;
    text-align: center;
    color: var(--el-color-white);
    font-size: 13px;
    pointer-events: none;
    z-index: 5;
    opacity: 0.8;
}

@media (max-width: 768px) {
    .login-form {
        width: 90%;
        padding: 40px 24px;
        margin: 0 20px;
    }
}

html.dark {
    .login::before {
        background: color-mix(in srgb, var(--el-color-black) 70%, transparent);
    }

    .login-form {
        background: color-mix(in srgb, var(--el-bg-color) 95%, transparent);
        border: 1px solid color-mix(in srgb, var(--el-color-white) 5%, transparent);
        box-shadow: 0 25px 50px -12px color-mix(in srgb, var(--el-color-black) 50%, transparent);
    }

    .header-box .title {
        color: var(--el-text-color-primary);
    }
    .header-box .sub-title {
        color: var(--el-text-color-secondary);
    }

    .login-type-switch {
        background: var(--el-fill-color);
        .switch-active-bar {
            background: var(--el-fill-color-light);
            box-shadow: none;
        }
        .switch-item {
            color: var(--el-text-color-secondary);
            &:hover {
                color: var(--el-text-color-regular);
            }
            &.active {
                color: var(--el-text-color-primary);
            }
        }
    }

    /* 输入框 - 使用深色半透明风格适配卡片 */
    :deep(.el-input__wrapper) {
        background-color: color-mix(in srgb, var(--el-bg-color) 60%, transparent) !important;
        border-color: var(--el-border-color);
    }

    :deep(.el-input__wrapper:hover) {
        border-color: var(--el-border-color-light);
    }

    :deep(.el-input__wrapper.is-focus) {
        border-color: var(--el-color-primary);
        background-color: color-mix(in srgb, var(--el-bg-color) 80%, transparent) !important;
    }

    .input-icon {
        color: var(--el-text-color-placeholder);
    }
    :deep(.el-input__wrapper.is-focus) .input-icon {
        color: var(--el-color-primary);
    }

    .form-options :deep(.el-checkbox__label) {
        color: var(--el-text-color-secondary);
    }
    .form-options .register-link {
        color: var(--el-color-primary-light-3);
    }

    .sms-input-group .sms-btn {
        background: rgba(var(--el-color-primary-rgb), 0.15);
        border-color: rgba(var(--el-color-primary-rgb), 0.3);
        color: var(--el-color-primary-light-3);
        &.is-disabled {
            background: var(--el-fill-color);
            border-color: var(--el-border-color);
            color: var(--el-text-color-placeholder);
        }
    }
}
</style>
