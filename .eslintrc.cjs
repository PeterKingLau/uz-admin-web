/* eslint-disable */

module.exports = {
  root: true,

  env: {
    browser: true,
    node: true,
    es2021: true,
  },

  // Vue 模板解析器
  parser: "vue-eslint-parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },

  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-recommended",

    // 不和 Prettier 冲突
    "plugin:prettier/recommended",
  ],

  rules: {
    // ⭐ 允许组件自闭合标签（你最需要的）
    "vue/html-self-closing": [
      "error",
      {
        html: {
          void: "always",
          normal: "never",
          component: "always",
        },
        svg: "always",
        math: "always",
      },
    ],

    // 允许使用单词组件名（管理系统/低代码平台很多都是单词名）
    "vue/multi-word-component-names": "off",

    // prettier 检查
    "prettier/prettier": "error",
  },
};
