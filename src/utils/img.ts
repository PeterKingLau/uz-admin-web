const FILE_BASE: string = import.meta.env.VITE_APP_FILE_BASE_URL || ''

/**
 * 根据提供的路径获取完整的图片 URL。
 * @param path - 图片的相对路径或完整的 URL。
 * @returns 完整的图片 URL。
 */
export function getImgUrl(path: string): string {
    if (!path) return ''

    // 如果 path 是完整的 URL，直接返回
    if (/^https?:\/\//i.test(path)) {
        return path
    }

    // 如果没有基础 URL，直接返回 path
    if (!FILE_BASE) {
        return path
    }

    // 拼接基础 URL 和相对路径
    return `${FILE_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}
