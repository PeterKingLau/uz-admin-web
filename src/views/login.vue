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
                <router-link v-if="register" to="/register" class="register-link">注册新账号</router-link>
            </div>

            <div class="agreement-box">
                <el-checkbox v-model="agreementChecked">
                    <span class="agreement-text">我已阅读并同意</span>
                    <router-link class="policy-link inline-policy-link" to="/h5/user-agreement" target="_blank" rel="noopener noreferrer">
                        《用户协议》
                    </router-link>
                    <span class="agreement-text">和</span>
                    <router-link class="policy-link inline-policy-link" to="/h5/privacy-policy" target="_blank" rel="noopener noreferrer">
                        《隐私政策》
                    </router-link>
                </el-checkbox>
            </div>

            <el-form-item style="margin-bottom: 0">
                <el-button :loading="loading" type="primary" class="login-btn" @click.prevent="handleLogin">
                    {{ loading ? '登录中...' : '立即登录' }}
                </el-button>
            </el-form-item>
        </el-form>

        <div class="el-login-footer">
            <div class="copyright-info">
                <span>Copyright © 2026 All Rights Reserved.</span>
                <a class="beian-link" href="https://beian.miit.gov.cn/#/Integrated/recordQuery" target="_blank" rel="noopener noreferrer">
                    蜀ICP备2026006423号-1
                </a>
            </div>
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
const agreementChecked = ref(false)

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

    if (!agreementChecked.value) {
        proxy?.$modal?.msgWarning?.('请先阅读并同意《用户协议》和《隐私政策》')
        return
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
    --login-black: var(--el-color-black);
    --login-white: var(--el-color-white);
    --login-primary: var(--el-color-primary);
    --login-primary-soft: var(--el-color-primary-light-3);
    --login-surface: color-mix(in srgb, var(--el-bg-color) 85%, transparent);
    --login-surface-strong: color-mix(in srgb, var(--el-bg-color) 95%, transparent);
    --login-surface-soft: color-mix(in srgb, var(--el-fill-color-light) 72%, var(--el-bg-color));
    --login-surface-muted: color-mix(in srgb, var(--el-fill-color-light) 84%, transparent);
    --login-border: color-mix(in srgb, var(--el-border-color) 72%, transparent);
    --login-border-strong: color-mix(in srgb, var(--el-border-color) 92%, transparent);
    --login-overlay: radial-gradient(
        circle at center,
        color-mix(in srgb, var(--login-black) 10%, transparent) 0%,
        color-mix(in srgb, var(--login-black) 40%, transparent) 100%
    );
    --login-shadow: color-mix(in srgb, var(--login-black) 10%, transparent);
    --login-shadow-strong: color-mix(in srgb, var(--login-black) 30%, transparent);
    --login-white-soft: color-mix(in srgb, var(--login-white) 40%, transparent);
    --login-white-muted: color-mix(in srgb, var(--login-white) 80%, transparent);
    --login-white-faint: color-mix(in srgb, var(--login-white) 60%, transparent);
    --login-white-dim: color-mix(in srgb, var(--login-white) 40%, transparent);
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-height: 100vh;
    background-image: url('../assets/images/login-background.jpg');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--login-overlay);
        z-index: 0;
    }
}

:global(html, body, #app) {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow-x: hidden;
}

.animate-in {
    animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUpFade {
    from {
        opacity: 0;
        transform: translateY(30px);
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
    padding: 40px;
    background: var(--login-surface);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow:
        0 20px 40px var(--login-shadow),
        0 1px 3px var(--login-white-soft) inset;
}

.header-box {
    text-align: center;
    margin-bottom: 32px;

    .title {
        margin: 0;
        font-size: 26px;
        font-weight: 800;
        color: var(--el-text-color-primary);
        letter-spacing: 0.5px;
    }

    .sub-title {
        margin-top: 8px;
        font-size: 14px;
        color: var(--el-text-color-secondary);
    }
}

.login-type-switch {
    position: relative;
    display: flex;
    background: color-mix(in srgb, var(--login-black) 4%, transparent);
    padding: 4px;
    border-radius: 12px;
    width: 100%;
    height: 44px;

    .switch-active-bar {
        position: absolute;
        top: 4px;
        left: 4px;
        width: calc(50% - 4px);
        height: calc(100% - 8px);
        background: var(--el-bg-color);
        border-radius: 8px;
        box-shadow: 0 2px 8px color-mix(in srgb, var(--login-black) 8%, transparent);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
            color: var(--el-text-color-primary);
        }

        &.active {
            color: var(--el-text-color-primary);
            font-weight: 600;
        }
    }
}

:deep(.el-form-item) {
    margin-bottom: 20px;
}

:deep(.login-type-item) {
    margin-bottom: 24px;
}

:deep(.el-input__wrapper) {
    background-color: color-mix(in srgb, var(--login-white) 60%, transparent);
    box-shadow: none !important;
    border: 1px solid color-mix(in srgb, var(--login-black) 10%, transparent);
    border-radius: 12px;
    padding: 0 16px;
    height: 48px;
    transition: all 0.3s ease;

    &:hover {
        background-color: color-mix(in srgb, var(--login-white) 90%, transparent);
        border-color: color-mix(in srgb, var(--login-black) 20%, transparent);
    }

    &.is-focus {
        background-color: var(--el-bg-color);
        border-color: var(--login-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--login-primary) 10%, transparent) !important;
    }
}

:deep(.el-input__inner) {
    height: 48px;
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-primary);

    &::placeholder {
        color: var(--el-text-color-placeholder);
        font-weight: 400;
    }
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
    &:hover {
        color: var(--el-text-color-secondary);
    }
}

.sms-input-group {
    display: flex;
    gap: 12px;
    width: 100%;

    .sms-input {
        flex: 1;
    }

    .sms-btn {
        height: 48px;
        padding: 0 20px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        background: color-mix(in srgb, var(--login-primary) 10%, transparent);
        border: 1px solid transparent;
        color: var(--login-primary);
        transition: all 0.3s;

        &:hover:not(.is-disabled) {
            background: var(--login-primary);
            color: var(--login-white);
            box-shadow: 0 4px 12px color-mix(in srgb, var(--login-primary) 20%, transparent);
        }

        &.is-disabled {
            background: color-mix(in srgb, var(--login-black) 4%, transparent);
            color: var(--el-text-color-placeholder);
        }
    }
}

.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
    margin-bottom: 20px;

    :deep(.el-checkbox) {
        display: inline-flex;
        align-items: center;
        min-height: 20px;
    }

    :deep(.el-checkbox__label) {
        color: var(--el-text-color-secondary);
        font-size: 13px;
        padding-left: 6px;
        line-height: 1.5;
        font-weight: 400;
    }

    .register-link {
        color: var(--el-color-primary);
        font-size: 13px;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;
        &:hover {
            color: var(--el-color-primary-dark-2);
        }
    }
}

.agreement-box {
    margin-bottom: 24px;

    :deep(.el-checkbox) {
        display: flex;
        align-items: flex-start;
        white-space: normal;
        min-height: 20px;
    }

    :deep(.el-checkbox__label) {
        color: var(--el-text-color-secondary);
        font-size: 13px;
        line-height: 1.5;
        font-weight: 400;
        padding-left: 8px;
    }

    .inline-policy-link {
        color: var(--el-color-primary);
        text-decoration: none;
        transition: opacity 0.2s;

        &:hover {
            opacity: 0.8;
        }
    }
}

.login-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 12px;
    background: var(--login-primary);
    border: none;
    box-shadow: 0 8px 16px color-mix(in srgb, var(--login-primary) 30%, transparent);
    transition: all 0.3s;
    letter-spacing: 1px;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 20px color-mix(in srgb, var(--login-primary) 40%, transparent);
        background: var(--login-primary-soft);
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 4px 10px color-mix(in srgb, var(--login-primary) 20%, transparent);
    }
}

.el-login-footer {
    position: fixed;
    bottom: 30px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    z-index: 5;

    .copyright-info {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--login-white-faint);
        font-size: 12px;

        .beian-link {
            color: inherit;
            text-decoration: none;
            transition: color 0.2s;

            &:hover {
                color: var(--login-white-muted);
            }
        }
    }
}

@media (max-width: 480px) {
    .login-form {
        width: calc(100% - 40px);
        padding: 32px 24px;
    }

    .el-login-footer {
        .copyright-info {
            flex-direction: column;
            gap: 6px;
        }
    }
}

html.dark {
    .login::before {
        background: radial-gradient(
            circle at center,
            color-mix(in srgb, var(--login-black) 20%, transparent) 0%,
            color-mix(in srgb, var(--login-black) 60%, transparent) 100%
        );
    }

    .login-form {
        background: color-mix(in srgb, var(--el-bg-color) 80%, transparent);
        box-shadow:
            0 20px 40px color-mix(in srgb, var(--login-black) 40%, transparent),
            0 1px 3px color-mix(in srgb, var(--login-white) 10%, transparent) inset;
    }

    .login-type-switch {
        background: color-mix(in srgb, var(--login-black) 20%, transparent);

        .switch-active-bar {
            background: var(--login-primary);
        }

        .switch-item.active {
            color: var(--login-white);
        }
    }

    :deep(.el-input__wrapper) {
        background-color: color-mix(in srgb, var(--login-black) 20%, transparent);
        border-color: color-mix(in srgb, var(--login-white) 10%, transparent);

        &:hover {
            background-color: color-mix(in srgb, var(--login-black) 40%, transparent);
            border-color: color-mix(in srgb, var(--login-white) 20%, transparent);
        }

        &.is-focus {
            background-color: color-mix(in srgb, var(--login-black) 60%, transparent);
        }
    }

    .sms-input-group .sms-btn {
        background: color-mix(in srgb, var(--login-primary) 20%, transparent);

        &.is-disabled {
            background: color-mix(in srgb, var(--login-black) 20%, transparent);
        }
    }
}
</style>
