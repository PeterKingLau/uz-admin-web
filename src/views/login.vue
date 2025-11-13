<template>
  <div class="login">
    <el-form
      ref="loginRef"
      :model="loginForm"
      :rules="activeRules"
      :validate-on-rule-change="false"
      class="login-form"
    >
      <h3 class="title">{{ title }}</h3>

      <!-- 登录方式切换：仅 PASSWORD / SMS -->
      <el-form-item style="text-align: center; margin-bottom: 12px">
        <el-radio-group
          v-model="loginForm.loginType"
          size="small"
          class="login-type-switch"
        >
          <el-radio-button value="PASSWORD">账号密码</el-radio-button>
          <el-radio-button value="SMS">短信验证码</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 账号 / 手机号 -->
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
            <svg-icon icon-class="user" class="el-input__icon input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <!-- 密码（仅 PASSWORD） -->
      <el-form-item v-if="loginForm.loginType === 'PASSWORD'" prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          size="large"
          autocomplete="off"
          placeholder="密码"
          :validate-event="false"
          @keyup.enter="handleLogin"
        >
          <template #prefix>
            <svg-icon icon-class="password" class="el-input__icon input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <!-- 短信验证码（仅 SMS） -->
      <el-form-item v-if="loginForm.loginType === 'SMS'" prop="smsCode">
        <el-input
          v-model="loginForm.smsCode"
          maxlength="6"
          size="large"
          placeholder="短信验证码"
          :validate-event="false"
          @keyup.enter="handleLogin"
        >
          <template #prefix>
            <svg-icon icon-class="message" class="el-input__icon input-icon" />
          </template>
          <template #append>
            <el-button
              :disabled="smsSending || smsCountdown > 0"
              @click="sendSms"
            >
              <span v-if="smsCountdown === 0">获取验证码</span>
              <span v-else>{{ smsCountdown }}s</span>
            </el-button>
          </template>
        </el-input>
      </el-form-item>

      <!-- 记住密码（仅 PASSWORD） -->
      <el-checkbox
        v-if="loginForm.loginType === 'PASSWORD'"
        v-model="loginForm.rememberMe"
        style="margin: 0 0 25px 0"
      >
        记住密码
      </el-checkbox>

      <el-form-item style="width: 100%">
        <el-button
          :loading="loading"
          size="large"
          type="primary"
          style="width: 100%"
          @click.prevent="handleLogin"
        >
          <span v-if="!loading">登 录</span>
          <span v-else>登 录 中...</span>
        </el-button>

        <div style="float: right" v-if="register">
          <router-link class="link-type" :to="'/register'"
            >立即注册</router-link
          >
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
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import Cookies from "js-cookie";
import { encrypt, decrypt } from "@/utils/jsencrypt";
import useUserStore from "@/store/modules/user";
import { sendPhoneCode } from "@/api/login";

const title = import.meta.env.VITE_APP_TITLE;
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();

const loginRef = ref();

// 仅两种登录类型
const loginForm = ref({
  loginType: "PASSWORD",
  username: "admin",
  password: "admin123",
  smsCode: "",
  rememberMe: false,
});

// 动态校验
const activeRules = computed(() => {
  const rules = {
    username: [
      { required: true, trigger: "blur", message: usernamePlaceholder.value },
    ],
  };

  if (loginForm.value.loginType === "PASSWORD") {
    rules.password = [
      { required: true, trigger: "blur", message: "请输入您的密码" },
    ];
  }

  if (loginForm.value.loginType === "SMS") {
    // 手机号格式 + 验证码
    rules.username = [
      { required: true, message: "请输入手机号", trigger: "blur" },
      {
        pattern: /^1[3-9]\d{9}$/,
        message: "请输入正确的手机号",
        trigger: ["blur", "change"],
      },
    ];
    rules.smsCode = [
      { required: true, message: "请输入短信验证码", trigger: "blur" },
      {
        pattern: /^\d{4,6}$/,
        message: "验证码格式不正确",
        trigger: ["blur", "change"],
      },
    ];
  }

  return rules;
});

// 仅在短信登录时：限制为数字、最长11位
const usernameMaxlength = computed(() =>
  loginForm.value.loginType === "SMS" ? 11 : 50
);

function handleUsernameInput(val) {
  if (loginForm.value.loginType === "SMS") {
    const cleaned = String(val).replace(/\D/g, "").slice(0, 11);
    // 不强行改首位为 1，只是限制输入；发送前再做完整校验
    loginForm.value.username = cleaned;
  } else {
    loginForm.value.username = val;
  }
}

const usernamePlaceholder = computed(() =>
  loginForm.value.loginType === "SMS" ? "请输入手机号" : "请输入您的账号"
);

const loading = ref(false);
const register = ref(false);
const redirect = ref();

// 切换类型
watch(
  () => loginForm.value.loginType,
  (val) => {
    if (val === "SMS") {
      loginForm.value.username = "";
      loginForm.value.password = "";
      loginForm.value.rememberMe = false;
    } else if (val === "PASSWORD") {
      loginForm.value.smsCode = "";
      smsCountdown.value = 0;
    }
  }
);

// 切换类型时清理
watch(
  () => loginForm.value.loginType,
  async (val) => {
    if (val === "SMS") {
      loginForm.value.username = "";
      loginForm.value.password = "";
      loginForm.value.rememberMe = false;
    } else if (val === "PASSWORD") {
      loginForm.value.smsCode = "";
      smsCountdown.value = 0;
    }
    await nextTick();
    loginRef.value?.clearValidate?.(["username", "password", "smsCode"]);
  }
);

// 短信逻辑
const smsSending = ref(false);
const smsCountdown = ref(0);

// 发送验证码
async function sendSms() {
  const phone = loginForm.value.username;
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    ElMessage.warning("请输入正确的手机号");
    return;
  }
  if (smsCountdown.value > 0 || smsSending.value) return;

  smsSending.value = true;
  try {
    await sendPhoneCode(loginForm.value.username);
    ElMessage.success("验证码已发送");
    smsCountdown.value = 60;
    const timer = setInterval(() => {
      smsCountdown.value--;
      if (smsCountdown.value <= 0) clearInterval(timer);
    }, 1000);
  } catch (err) {
    ElMessage.error("发送失败，请稍后重试");
  } finally {
    smsSending.value = false;
  }
}

onMounted(() => {
  // 仅在密码登录下恢复“记住密码”
  const username = Cookies.get("username");
  const password = Cookies.get("password");
  const rememberMe = Cookies.get("rememberMe");
  loginForm.value.username = username ?? loginForm.value.username;
  if (rememberMe) {
    loginForm.value.password = password
      ? decrypt(password)
      : loginForm.value.password;
    loginForm.value.rememberMe = Boolean(rememberMe);
  }
});

function handleLogin() {
  loginRef.value.validate((valid) => {
    if (!valid) return;
    loading.value = true;

    // Cookie 只在密码登录时处理
    if (
      loginForm.value.loginType === "PASSWORD" &&
      loginForm.value.rememberMe
    ) {
      Cookies.set("username", loginForm.value.username, { expires: 30 });
      Cookies.set("password", encrypt(loginForm.value.password), {
        expires: 30,
      });
      Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 });
    } else {
      Cookies.remove("username");
      Cookies.remove("password");
      Cookies.remove("rememberMe");
    }

    // 只带需要的字段
    const payload = {
      loginType: loginForm.value.loginType,
      username: (loginForm.value.username || "").trim(),
    };
    if (loginForm.value.loginType === "PASSWORD" && loginForm.value.password) {
      payload.password = loginForm.value.password;
    }
    if (loginForm.value.loginType === "SMS" && loginForm.value.smsCode) {
      payload.smsCode = loginForm.value.smsCode;
    }

    userStore
      .login(payload)
      .then(() => {
        const query = route.query;
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== "redirect") acc[cur] = query[cur];
          return acc;
        }, {});
        router.push({ path: redirect.value || "/", query: otherQueryParams });
      })
      .catch(() => {
        loading.value = false;
      });
  });
}
</script>

<style lang="scss" scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-image: url("../assets/images/login-background.jpg");
  background-size: cover;
}
.title {
  margin: 0 auto 16px auto;
  text-align: center;
  color: #707070;
}
.login-form {
  border-radius: 6px;
  background: #fff;
  width: 400px;
  padding: 22px 22px 5px 22px;
  z-index: 1;
  .el-input {
    height: 40px;
    input {
      height: 40px;
    }
  }
  .input-icon {
    height: 39px;
    width: 14px;
    margin-left: 0;
  }
  .login-type-switch {
    display: inline-flex;
    background: var(--el-fill-color-light);
    border-radius: 20px;
    padding: 4px;
  }

  .login-type-switch :deep(.el-radio-button__inner) {
    border: none !important;
    background: transparent;
    box-shadow: none !important;
    padding: 6px 16px;
    border-radius: 16px;
    color: var(--el-text-color-primary);
    transition: 0.2s;
  }

  .login-type-switch :deep(.is-active .el-radio-button__inner) {
    background: #409eff;
    color: #fff !important;
  }

  .dark .login-type-switch {
    background: #2f2f2f;
  }

  .dark .login-type-switch :deep(.is-active .el-radio-button__inner) {
    background: #409eff;
  }
}
.el-login-footer {
  height: 40px;
  line-height: 40px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: #fff;
  font-family: Arial;
  font-size: 12px;
  letter-spacing: 1px;
}
</style>
