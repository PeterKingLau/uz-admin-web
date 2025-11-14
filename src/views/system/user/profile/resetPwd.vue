<template>
  <el-form ref="pwdRef" :model="form" :rules="rules" label-width="80px">
    <el-form-item label="旧密码" prop="oldPassword">
      <el-input
        v-model="form.oldPassword"
        placeholder="请输入旧密码"
        type="password"
        show-password
      />
    </el-form-item>

    <el-form-item label="新密码" prop="newPassword">
      <el-input
        v-model="form.newPassword"
        placeholder="请输入新密码"
        type="password"
        show-password
      />
    </el-form-item>

    <el-form-item label="确认密码" prop="confirmPassword">
      <el-input
        v-model="form.confirmPassword"
        placeholder="请确认新密码"
        type="password"
        show-password
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submit">保存</el-button>
      <el-button type="danger" @click="close">关闭</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, getCurrentInstance } from "vue";
import { updateUserPwd } from "@/api/system/user";

const { proxy } = getCurrentInstance();

// 表单 ref
const pwdRef = ref(null);

// 表单数据
const form = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// 自定义校验：两次密码是否一致
const equalToPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error("确认密码不能为空"));
    return;
  }
  if (form.newPassword !== value) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

const rules = {
  oldPassword: [{ required: true, message: "旧密码不能为空", trigger: "blur" }],
  newPassword: [
    { required: true, message: "新密码不能为空", trigger: "blur" },
    {
      min: 6,
      max: 20,
      message: "长度在 6 到 20 个字符",
      trigger: "blur",
    },
    {
      pattern: /^[^<>"'|\\]+$/,
      message: "不能包含非法字符：< > \" ' \\ |",
      trigger: "blur",
    },
  ],
  confirmPassword: [
    { required: true, message: "确认密码不能为空", trigger: "blur" },
    { validator: equalToPassword, trigger: ["blur", "change"] },
  ],
};

/** 提交按钮 */
function submit() {
  if (!pwdRef.value) return;

  pwdRef.value.validate((valid) => {
    if (!valid) return;

    updateUserPwd(form.oldPassword, form.newPassword).then(() => {
      proxy.$modal?.msgSuccess && proxy.$modal.msgSuccess("修改成功");
      // 提交成功后，出于安全考虑把密码清空
      form.oldPassword = "";
      form.newPassword = "";
      form.confirmPassword = "";
    });
  });
}

/** 关闭按钮 */
function close() {
  proxy.$tab?.closePage && proxy.$tab.closePage();
}
</script>
