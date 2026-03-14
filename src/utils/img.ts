const FILE_BASE: string = import.meta.env.VITE_APP_FILE_BASE_URL || ''

const isAbsoluteResourcePath = (path: string): boolean => /^(https?:)?\/\//i.test(path) || /^(blob|data|file):/i.test(path)

export function getImgUrl(path: string): string {
    const normalizedPath = String(path || '').trim()
    if (!normalizedPath) return ''

    if (isAbsoluteResourcePath(normalizedPath)) {
        if (/^\/\//.test(normalizedPath)) {
            const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:'
            return `${protocol}${normalizedPath}`
        }
        return normalizedPath
    }

    if (!FILE_BASE) return normalizedPath

    return `${FILE_BASE.replace(/\/$/, '')}/${normalizedPath.replace(/^\//, '')}`
}
