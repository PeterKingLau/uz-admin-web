<template>
    <div class="login">
        <div class="bg-shape shape-1"></div>
        <div class="bg-shape shape-2"></div>

        <el-form ref="loginRef" :model="loginForm" :rules="activeRules" :validate-on-rule-change="false" class="login-form animate-in">
            <div class="header-box">
                <h3 class="title">欢迎回来</h3>
                <p class="sub-title">请登录您的账户</p>
            </div>

            <el-form-item class="login-type-item">
                <div class="login-type-switch">
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
                        <svg-icon icon-class="ep:user" class="input-icon" />
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
                        <svg-icon icon-class="mdi:lock" class="input-icon" />
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
                            <svg-icon icon-class="ep:message" class="input-icon" />
                        </template>
                    </el-input>

                    <el-button class="sms-btn" type="primary" plain :disabled="smsSending || smsCountdown > 0" @click="sendSms">
                        {{ smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码' }}
                    </el-button>
                </div>
            </el-form-item>

            <div class="form-options">
                <el-checkbox v-if="loginForm.loginType === 'PASSWORD'" v-model="loginForm.rememberMe" label="记住我" />
                <router-link v-if="register" to="/register" class="register-link"> 注册账号 </router-link>
            </div>

            <el-form-item style="margin-bottom: 0">
                <el-button :loading="loading" type="primary" class="login-btn" @click.prevent="handleLogin">
                    {{ loading ? '登录中...' : '登录' }}
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
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f4f8 0%, #dbeafe 100%);
    background-image: url('../assets/images/login-background.jpg');
    background-size: cover;
    background-position: center;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(2px);
        z-index: 0;
    }
}

.bg-shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    z-index: 0;
    opacity: 0.5;
}
.shape-1 {
    width: 400px;
    height: 400px;
    background: #3b82f6;
    top: -150px;
    left: -100px;
}
.shape-2 {
    width: 300px;
    height: 300px;
    background: #60a5fa;
    bottom: -100px;
    right: -50px;
}

.animate-in {
    animation: slideUp 0.5s ease-out;
}
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.login-form {
    position: relative;
    z-index: 10;
    width: 400px;
    padding: 36px 40px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border-radius: 12px;
    box-shadow:
        0 10px 40px -10px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(255, 255, 255, 1) inset;
}

.header-box {
    text-align: center;
    margin-bottom: 24px;

    .title {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: 0.5px;
    }

    .sub-title {
        margin-top: 6px;
        font-size: 13px;
        color: #64748b;
    }
}

.login-type-switch {
    display: flex;
    background: #f1f5f9;
    padding: 3px;
    border-radius: 6px;
    margin-bottom: 4px;
    width: 100%;

    .switch-item {
        /* 核心修复：使用flex布局强制完全居中 */
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 1;
        /* 保持一定高度 */
        padding: 6px 0;
        font-size: 13px;
        /* 重置行高，防止文字自带的leading导致偏下 */
        line-height: 1;
        color: #64748b;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s ease;
        font-weight: 500;

        &:hover {
            color: #334155;
        }

        &.active {
            background: #ffffff;
            color: #3b82f6;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
            font-weight: 600;
        }
    }
}

:deep(.el-form-item) {
    margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
    background-color: #f8fafc;
    box-shadow: none !important;
    border-radius: 6px;
    padding: 0 12px;
    height: 38px;
    line-height: 38px;
    transition: all 0.2s;

    &:hover {
        background-color: #f1f5f9;
    }

    &.is-focus {
        background-color: #ffffff;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
        border: 1px solid #3b82f6;
    }
}

:deep(.el-input__inner) {
    height: 38px;
    font-size: 14px;
    color: #334155;
}

.input-icon {
    font-size: 16px;
    color: #94a3b8;
    margin-right: 6px;
}

.sms-input-group {
    display: flex;
    gap: 10px;

    .sms-input {
        flex: 1;
    }

    .sms-btn {
        height: 38px;
        min-width: 100px;
        border-radius: 6px;
        padding: 0 12px;
        font-size: 13px;
    }
}

.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: -4px;
    margin-bottom: 20px;

    :deep(.el-checkbox__label) {
        color: #64748b;
        font-size: 13px;
    }

    .register-link {
        color: #3b82f6;
        font-size: 13px;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}

.login-btn {
    width: 100%;
    height: 38px;
    font-size: 15px;
    font-weight: 500;
    border-radius: 6px;
    background: #3b82f6;
    border: none;
    transition: all 0.2s;

    &:hover {
        background: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
    }

    &:active {
        transform: translateY(0);
    }
}

.el-login-footer {
    position: fixed;
    bottom: 16px;
    width: 100%;
    text-align: center;
    color: rgba(100, 116, 139, 0.6);
    font-size: 12px;
    pointer-events: none;
}

@media (max-width: 768px) {
    .login-form {
        width: 92%;
        padding: 30px 24px;
    }
}
</style>
