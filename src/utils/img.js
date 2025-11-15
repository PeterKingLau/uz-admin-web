const FILE_BASE = import.meta.env.VITE_APP_FILE_BASE_URL || "";

export function getImgUrl(path) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!FILE_BASE) {
    return path;
  }

  return FILE_BASE.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
}
