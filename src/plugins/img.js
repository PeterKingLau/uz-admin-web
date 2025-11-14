import { getImgUrl } from "@/utils/img";

export default {
  install(app) {
    // 全局方法（模板内可直接用 $imgUrl）
    app.config.globalProperties.$imgUrl = getImgUrl;

    // 组合式 API 注入
    app.provide("imgUrl", getImgUrl);
  },
};
