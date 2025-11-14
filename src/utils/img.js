// src/utils/img.js

// 文件访问基础前缀：例如 http://192.168.100.32/api
const FILE_BASE = import.meta.env.VITE_APP_FILE_BASE_URL || ""; // 没配置就空

export function getImgUrl(path) {
  if (!path) return "";

  // 已经是完整 URL（http/https），直接用
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // 必须配置 FILE_BASE，否则就直接返回原始 path（防止再次拼错 localhost）
  if (!FILE_BASE) {
    return path;
  }

  // 拼接：去掉多余的 / ，保持 FILE_BASE + / + path
  return FILE_BASE.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
}
