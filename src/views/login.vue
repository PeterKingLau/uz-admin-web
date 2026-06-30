<template>
    <div class="login" :class="loginThemeClass">
        <section class="login-visual" aria-hidden="true">
            <div class="visual-content">
                <h1>
                    <span class="title-line-start">上测吧测一测</span>
                    <span class="title-line-end">职业方向更明确</span>
                </h1>
            </div>
        </section>

        <section class="login-panel">
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
                    <el-input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'" autocomplete="off" placeholder="请输入您的密码" @keyup.enter="handleLogin">
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
                    <span class="agreement-text">登录即表示您已阅读并同意</span>
                    <router-link class="policy-link inline-policy-link" to="/user-agreement" target="_blank" rel="noopener noreferrer">《用户协议》</router-link>
                    <span class="agreement-text">和</span>
                    <router-link class="policy-link inline-policy-link" to="/privacy-policy" target="_blank" rel="noopener noreferrer">《隐私政策》</router-link>
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
                    <a
                        class="beian-link"
                        href="https://beian.miit.gov.cn/#/Integrated/recordQuery"
                        target="_blank"
                        rel="noopener noreferrer"
                        @click.prevent="handleBeianLinkClick"
                    >
                        {{ beianRecordNumber }}
                    </a>
                </div>
            </div>
        </section>

        <el-dialog
            v-model="beianDialogVisible"
            title="备案查询"
            width="360px"
            append-to-body
            align-center
            class="beian-dialog"
            @opened="selectBeianRecordNumber"
        >
            <div class="beian-dialog-content">
                <p>备案号已为您选中，可直接复制后前往备案查询页。</p>
                <input
                    ref="beianRecordInputRef"
                    class="beian-record-input"
                    type="text"
                    :value="beianRecordNumber"
                    readonly
                    @focus="selectBeianRecordNumber"
                    @click="selectBeianRecordNumber"
                />
            </div>
            <template #footer>
                <el-button @click="beianDialogVisible = false">关闭</el-button>
                <el-button type="primary" @click="openBeianRecordQuery">打开查询页</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
defineOptions({ name: 'ViewsLogin' })
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, getCurrentInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import { encryptRememberedPassword, decryptRememberedPassword } from '@/utils/rememberMeCrypto'
import useUserStore from '@/store/modules/user'
import { sendPhoneCode } from '@/api/login/login'
import { copyTextToClipboard } from '@/directive/common/copyText'
import { isClientRoutePath } from '@/utils/routeAccess'

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
const usernamePlaceholder = computed(() => (loginForm.value.loginType === 'SMS' ? '请输入手机号' : '请输入您的账号'))

function handleUsernameInput(val) {
    if (loginForm.value.loginType === 'SMS') {
        const cleaned = String(val).replace(/\D/g, '').slice(0, 11)
        loginForm.value.username = cleaned
    } else {
        loginForm.value.username = val
    }
}

const loading = ref(false)
const register = ref(false)
const redirect = ref()
const LOGIN_THEME_QUERY_KEYS = ['theme', 'platform', 'mode', 'entry']
const beianRecordNumber = '蜀ICP备2026006423号-1'
const beianRecordUrl = 'https://beian.miit.gov.cn/#/Integrated/recordQuery'
const beianDialogVisible = ref(false)
const beianRecordInputRef = ref()
const BEIAN_REDIRECT_DELAY_MS = 320
const DAY_IN_MS = 24 * 60 * 60 * 1000
const DEFAULT_REMEMBER_ME_DAYS = 30
const MIN_REMEMBER_ME_DAYS = 1
const MAX_REMEMBER_ME_DAYS = 365
const appStoragePrefix = `${String(import.meta.env.VITE_APP_TITLE || 'ceba-web').trim() || 'ceba-web'}`
const rememberedPasswordStorageKey = `${appStoragePrefix}:remembered-password`

function resolveRememberMeDays() {
    const rawDays = Number(import.meta.env.VITE_APP_REMEMBER_ME_DAYS || DEFAULT_REMEMBER_ME_DAYS)
    if (!Number.isFinite(rawDays)) return DEFAULT_REMEMBER_ME_DAYS
    return Math.min(MAX_REMEMBER_ME_DAYS, Math.max(MIN_REMEMBER_ME_DAYS, Math.round(rawDays)))
}

const rememberMeDays = resolveRememberMeDays()

function normalizeQueryText(value) {
    const raw = Array.isArray(value) ? value[0] : value
    return String(raw || '')
        .trim()
        .toLowerCase()
}

function normalizeRedirectPath(value) {
    const raw = Array.isArray(value) ? value[0] : value
    const text = String(raw || '').trim()
    if (!text) return ''
    try {
        return decodeURIComponent(text)
    } catch {
        return text
    }
}

const loginTheme = computed(() => {
    const query = route.query || {}
    const explicitTheme = LOGIN_THEME_QUERY_KEYS.map(key => normalizeQueryText(query[key])).find(value => value === 'client' || value === 'admin')
    if (explicitTheme) return explicitTheme
    return isClientRoutePath(normalizeRedirectPath(redirect.value)) ? 'client' : 'admin'
})

const loginThemeClass = computed(() => `theme-${loginTheme.value}`)

function parseStoredBoolean(value) {
    return value === 'true' || value === '1'
}

function buildRememberedRecord(value) {
    return JSON.stringify({
        value: String(value ?? ''),
        expiresAt: Date.now() + rememberMeDays * DAY_IN_MS
    })
}

function getRememberedRecord(key) {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        const expiresAt = Number(parsed?.expiresAt || 0)
        if (!Number.isFinite(expiresAt) || expiresAt <= 0 || Date.now() >= expiresAt) {
            localStorage.removeItem(key)
            return null
        }
        return {
            value: String(parsed?.value ?? ''),
            expiresAt
        }
    } catch {
        try {
            localStorage.removeItem(key)
        } catch {
            return null
        }
        return null
    }
}

function getRememberedPasswordCipher() {
    return getRememberedRecord(rememberedPasswordStorageKey)?.value || ''
}

function setRememberedPasswordCipher(value) {
    try {
        localStorage.setItem(rememberedPasswordStorageKey, buildRememberedRecord(value))
    } catch {
        return
    }
}

function removeRememberedPasswordCipher() {
    try {
        localStorage.removeItem(rememberedPasswordStorageKey)
    } catch {
        return
    }
}

function clearRememberedLoginState() {
    Cookies.remove('username')
    Cookies.remove('password')
    Cookies.remove('rememberMe')
    removeRememberedPasswordCipher()
}

async function persistRememberedLoginState() {
    Cookies.set('username', loginForm.value.username, { expires: rememberMeDays })
    Cookies.set('rememberMe', 'true', { expires: rememberMeDays })
    setRememberedPasswordCipher(await encryptRememberedPassword(loginForm.value.password))
    Cookies.remove('password')
}

function handleBeianLinkClick() {
    if (copyTextToClipboard(beianRecordNumber)) {
        proxy?.$modal?.msgSuccess?.('备案号已复制')
        window.setTimeout(openBeianRecordQuery, BEIAN_REDIRECT_DELAY_MS)
        return
    }
    beianDialogVisible.value = true
}

function selectBeianRecordNumber() {
    nextTick(() => {
        beianRecordInputRef.value?.focus?.()
        beianRecordInputRef.value?.select?.()
    })
}

function openBeianRecordQuery() {
    window.open(beianRecordUrl, '_blank', 'noopener,noreferrer')
}

watch(
    () => route.query.redirect,
    value => {
        redirect.value = Array.isArray(value) ? value[0] : value
    },
    { immediate: true }
)

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
let smsCountdownTimer = null

function clearSmsCountdownTimer() {
    if (!smsCountdownTimer) return
    clearInterval(smsCountdownTimer)
    smsCountdownTimer = null
}

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
        clearSmsCountdownTimer()
        smsCountdownTimer = setInterval(() => {
            smsCountdown.value--
            if (smsCountdown.value <= 0) clearSmsCountdownTimer()
        }, 1000)
    } catch {
        proxy?.$modal?.msgError?.('发送失败，请稍后重试')
    } finally {
        smsSending.value = false
    }
}

onBeforeUnmount(() => {
    clearSmsCountdownTimer()
})

async function restoreRememberedLoginState() {
    const username = Cookies.get('username')
    const passwordCookie = Cookies.get('password')
    const passwordCipher = getRememberedPasswordCipher()
    const rememberMeEnabled = parseStoredBoolean(Cookies.get('rememberMe'))

    if (passwordCookie) {
        Cookies.remove('password')
    }

    if (!rememberMeEnabled) {
        clearRememberedLoginState()
        loginForm.value.rememberMe = false
        loginForm.value.password = ''
        return
    }

    if (!username || !passwordCipher) {
        clearRememberedLoginState()
        loginForm.value.rememberMe = false
        loginForm.value.password = ''
        return
    }

    loginForm.value.loginType = 'PASSWORD'
    loginForm.value.rememberMe = true
    loginForm.value.username = username ?? loginForm.value.username

    try {
        loginForm.value.password = await decryptRememberedPassword(passwordCipher)
    } catch (error) {
        console.warn('Failed to restore remembered password', error)
        clearRememberedLoginState()
        loginForm.value.rememberMe = false
        loginForm.value.password = ''
    }
}

onMounted(() => {
    void restoreRememberedLoginState()
})

function handleLogin() {
    loginForm.value.username = (loginForm.value.username || '').trim()
    if (loginForm.value.loginType === 'SMS') {
        loginForm.value.smsCode = (loginForm.value.smsCode || '').trim()
    }

    loginRef.value.validate(async valid => {
        if (!valid) return
        loading.value = true

        const payload = {
            loginType: loginForm.value.loginType,
            username: loginForm.value.username,
            ...(loginForm.value.loginType === 'PASSWORD' && { password: loginForm.value.password }),
            ...(loginForm.value.loginType === 'SMS' && { smsCode: loginForm.value.smsCode })
        }

        userStore
            .login(payload)
            .then(async () => {
                try {
                    if (loginForm.value.loginType === 'PASSWORD' && loginForm.value.rememberMe) {
                        await persistRememberedLoginState()
                    } else {
                        clearRememberedLoginState()
                    }
                } catch (error) {
                    clearRememberedLoginState()
                    console.warn('Failed to persist remembered password', error)
                }

                const query = route.query
                const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
                    if (cur !== 'redirect') acc[cur] = query[cur]
                    return acc
                }, {})
                await router.push({ path: redirect.value || '/index', query: otherQueryParams })
            })
            .catch(error => {
                loading.value = false
                console.error('Login or redirect failed:', error)
                proxy?.$modal?.msgError?.(error?.message || '登录失败，请检查账号信息或稍后重试')
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
    --login-primary: #2563eb;
    --login-primary-soft: #3b82f6;
    --login-button-text: var(--login-white);
    --login-panel-bg: var(--el-bg-color);
    --login-visual-side-overlay: linear-gradient(90deg, color-mix(in srgb, var(--login-black) 44%, transparent), color-mix(in srgb, var(--login-black) 10%, transparent));
    --login-visual-bottom-overlay: linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--login-black) 32%, transparent) 100%);
    --login-surface: var(--el-bg-color);
    --login-surface-strong: color-mix(in srgb, var(--el-bg-color) 95%, transparent);
    --login-surface-soft: color-mix(in srgb, var(--el-fill-color-light) 72%, var(--el-bg-color));
    --login-surface-muted: color-mix(in srgb, var(--el-fill-color-light) 84%, transparent);
    --login-border: color-mix(in srgb, var(--el-border-color) 72%, transparent);
    --login-border-strong: color-mix(in srgb, var(--el-border-color) 92%, transparent);
    --login-shadow: color-mix(in srgb, var(--login-black) 10%, transparent);
    --login-shadow-strong: color-mix(in srgb, var(--login-black) 30%, transparent);
    --login-white-soft: color-mix(in srgb, var(--login-white) 40%, transparent);
    --login-white-muted: color-mix(in srgb, var(--login-white) 80%, transparent);
    --login-white-faint: color-mix(in srgb, var(--login-white) 60%, transparent);
    --login-white-dim: color-mix(in srgb, var(--login-white) 40%, transparent);
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(400px, 0.72fr);
    box-sizing: border-box;
    width: 100%;
    min-height: 100vh;
    background: var(--el-bg-color);
    overflow: hidden;
}

.login.theme-admin {
    --el-color-primary: #2563eb;
    --el-color-primary-light-3: #60a5fa;
    --el-color-primary-light-5: #93c5fd;
    --el-color-primary-light-7: #bfdbfe;
    --el-color-primary-light-8: #dbeafe;
    --el-color-primary-light-9: #eff6ff;
    --el-color-primary-dark-2: #1d4ed8;
}

.login.theme-client {
    --login-primary: #d99a00;
    --login-primary-soft: #f6c453;
    --login-button-text: #4f3a00;
    --login-panel-bg: #fffdf7;
    --login-surface: #ffffff;
    --login-visual-side-overlay: linear-gradient(90deg, rgba(74, 54, 0, 0.42), rgba(74, 54, 0, 0.08));
    --login-visual-bottom-overlay: linear-gradient(180deg, transparent 0%, rgba(74, 54, 0, 0.28) 100%);
    --el-color-primary: #d99a00;
    --el-color-primary-light-3: #f0c04f;
    --el-color-primary-light-5: #f6d887;
    --el-color-primary-light-7: #fae9b8;
    --el-color-primary-light-8: #fff2cf;
    --el-color-primary-light-9: #fff8e6;
    --el-color-primary-dark-2: #b8870d;
}

.login-visual {
    position: relative;
    min-height: 100vh;
    padding: clamp(48px, 7vw, 92px);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background-image:
        var(--login-visual-side-overlay),
        url('../assets/images/login-background.jpg');
    background-size: cover;
    background-position: center;

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--login-visual-bottom-overlay);
        pointer-events: none;
    }
}

.visual-content {
    position: relative;
    z-index: 1;
    width: min(76vw, 720px);
    max-width: 100%;
    margin-top: 0;
    color: var(--login-white);
    text-align: left;

    h1 {
        margin: 0;
        width: 100%;
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        font-size: clamp(38px, 4.2vw, 62px);
        line-height: 1.12;
        font-weight: 800;
        letter-spacing: 0;

        span {
            display: block;
            width: max-content;
            max-width: 100%;
            white-space: nowrap;
        }

        .title-line-start {
            justify-self: start;
        }

        .title-line-end {
            justify-self: end;
        }
    }

}

.login-panel {
    min-height: 100vh;
    padding: 48px clamp(28px, 4vw, 56px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    background: var(--login-panel-bg);
    overflow-y: auto;
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
    flex-shrink: 0;
    width: 380px;
    max-width: 100%;
    padding: 40px;
    background: var(--login-surface);
    border: 1px solid var(--login-border);
    border-radius: 20px;
    box-shadow:
        0 20px 42px var(--login-shadow),
        0 1px 0 var(--login-white-soft) inset;
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
    transition:
        background-color var(--app-motion-normal),
        border-color var(--app-motion-normal),
        box-shadow var(--app-motion-normal);

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

:deep(.el-input__prefix),
:deep(.el-input__suffix) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

:deep(.el-input__prefix) {
    margin-right: 8px;
}

:deep(.el-input__suffix) {
    margin-left: 8px;
}

:deep(.el-input__prefix-inner),
:deep(.el-input__suffix-inner) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.input-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    font-size: 18px;
    line-height: 1;
    color: var(--el-text-color-placeholder);
    margin-right: 0;
    transition: color 0.3s;
}

:deep(.el-input__wrapper.is-focus) .input-icon {
    color: var(--login-primary);
}

.password-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    cursor: pointer;
    color: var(--el-text-color-placeholder);
    font-size: 18px;
    line-height: 1;
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
        transition:
            background-color var(--app-motion-fast),
            border-color var(--app-motion-fast),
            color var(--app-motion-fast),
            box-shadow var(--app-motion-fast);

        &:hover:not(.is-disabled) {
            background: var(--login-primary);
            color: var(--login-button-text);
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
        color: var(--login-primary);
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
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.6;
    text-align: center;

    .inline-policy-link {
        color: var(--login-primary);
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
    color: var(--login-button-text);
    box-shadow: 0 8px 16px color-mix(in srgb, var(--login-primary) 30%, transparent);
    transition:
        background-color var(--app-motion-fast),
        box-shadow var(--app-motion-fast),
        opacity var(--app-motion-fast);
    letter-spacing: 1px;

    &:hover {
        opacity: 0.94;
        box-shadow: 0 8px 18px color-mix(in srgb, var(--login-primary) 32%, transparent);
        background: var(--login-primary-soft);
    }

    &:active {
        box-shadow: 0 4px 10px color-mix(in srgb, var(--login-primary) 20%, transparent);
    }
}

.el-login-footer {
    width: 380px;
    max-width: 100%;
    margin-top: 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    .copyright-info {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--el-text-color-secondary);
        font-size: 12px;

        .beian-link {
            color: inherit;
            text-decoration: none;
            transition: color 0.2s;

            &:hover {
                color: var(--login-primary);
            }
        }
    }
}

:global(.beian-dialog) {
    border-radius: 12px;

    .el-dialog__header {
        margin-right: 0;
        padding-bottom: 8px;
    }

    .el-dialog__body {
        padding-top: 8px;
    }
}

.beian-dialog-content {
    display: grid;
    gap: 12px;

    p {
        margin: 0;
        color: var(--el-text-color-secondary);
        font-size: 14px;
        line-height: 1.6;
    }
}

.beian-record-input {
    width: 100%;
    height: 40px;
    padding: 0 12px;
    box-sizing: border-box;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
    font-size: 14px;
    outline: none;

    &:focus {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    }
}

@media (max-width: 960px) {
    .login {
        grid-template-columns: 1fr;
        overflow-y: auto;
    }

    .login-visual {
        min-height: 260px;
        padding: 36px 28px;
    }

    .login-panel {
        min-height: auto;
        padding: 32px 20px 40px;
    }

    .visual-content {
        width: min(100%, 680px);

        h1 {
            font-size: 34px;
        }
    }
}

@media (max-width: 480px) {
    .login-visual {
        min-height: 220px;
        padding: 28px 20px;
    }

    .visual-content {
        h1 {
            grid-template-columns: 1fr;
            gap: 8px;
            font-size: 28px;
        }

    }

    .login-form {
        width: 100%;
        padding: 32px 24px;
    }

    .el-login-footer {
        .copyright-info {
            flex-direction: column;
            gap: 6px;
        }
    }
}

:global(html.dark) {
    .login-panel {
        background: var(--login-panel-bg, var(--el-bg-color-page));
    }

    .login.theme-client {
        --login-panel-bg: #18140b;
        --login-surface: #1f1a10;
        --login-visual-side-overlay: linear-gradient(90deg, rgba(43, 31, 0, 0.58), rgba(43, 31, 0, 0.16));
        --login-visual-bottom-overlay: linear-gradient(180deg, transparent 0%, rgba(43, 31, 0, 0.46) 100%);
    }

    .login-form {
        background: var(--login-surface, var(--el-bg-color-overlay));
        border-color: var(--el-border-color-darker);
        box-shadow:
            0 20px 40px color-mix(in srgb, var(--login-black) 34%, transparent),
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
