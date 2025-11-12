import request from "@/utils/request";

// 登录方法
export function login({
  username,
  password,
  loginType = "PASSWORD",
  smsCode = "",
}) {
  const data = {
    username,
    loginType,
  };

  if (loginType === "PASSWORD" && password) {
    data.password = password;
  }

  if (loginType === "SMS" && smsCode) {
    data.smsCode = smsCode;
  }

  return request({
    url: "/login",
    headers: {
      isToken: false,
      repeatSubmit: false,
    },
    method: "post",
    data,
  });
}

// 发送短信验证码
export function sendPhoneCode(username) {
  return request({
    url: "/sendPhoneCode",
    method: "post",
    headers: {
      isToken: false, // 不带 token
      repeatSubmit: false,
    },
    data: { username },
  });
}

// 注册方法
export function register(data) {
  return request({
    url: "/register",
    headers: {
      isToken: false,
    },
    method: "post",
    data: data,
  });
}

// 获取用户详细信息
export function getInfo() {
  return request({
    url: "/getInfo",
    method: "get",
  });
}

// 退出方法
export function logout() {
  return request({
    url: "/logout",
    method: "post",
  });
}

// 获取验证码
export function getCodeImg() {
  return request({
    url: "/captchaImage",
    headers: {
      isToken: false,
    },
    method: "get",
    timeout: 20000,
  });
}
