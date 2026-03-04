const VIDEO_FRAME_CAPTURE_TIMEOUT = 15000

const toStringOrUndefined = (value: unknown): string | undefined => {
    if (value === null || value === undefined) return undefined
    if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed ? trimmed : undefined
    }
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    return undefined
}

export const normalizeMediaUrls = (mediaUrls?: string | string[]): string[] => {
    if (!mediaUrls) return []
    if (Array.isArray(mediaUrls)) {
        return mediaUrls.map(item => String(item || '').trim()).filter(Boolean)
    }

    const trimmed = mediaUrls.trim()
    if (!trimmed) return []

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) {
                return parsed.map(item => String(item || '').trim()).filter(Boolean)
            }
        } catch {
            // keep fallback split behavior
        }
    }

    return trimmed
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
}

export const normalizeStoragePath = (url: string): string => {
    const raw = String(url || '').trim()
    if (!raw) return ''
    const clean = raw.split('#')[0].split('?')[0]

    const fileBaseUrl = toStringOrUndefined((import.meta as any)?.env?.VITE_APP_FILE_BASE_URL)
        ?.trim()
        .replace(/\/+$/, '')
    if (fileBaseUrl) {
        if (clean === fileBaseUrl) return ''
        if (clean.startsWith(`${fileBaseUrl}/`)) {
            return clean.slice(fileBaseUrl.length + 1)
        }
        if (clean.startsWith(fileBaseUrl)) {
            return clean.slice(fileBaseUrl.length).replace(/^\/+/, '')
        }
    }

    if (/^https?:\/\//i.test(clean)) {
        try {
            const parsed = new URL(clean)
            return parsed.pathname.replace(/^\/+/, '')
        } catch {
            return clean
        }
    }

    return clean.replace(/^\/+/, '')
}

const withTimeout = <T>(promise: Promise<T>, timeout = VIDEO_FRAME_CAPTURE_TIMEOUT, message = 'video frame generation timeout'): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const timer = globalThis.setTimeout(() => reject(new Error(message)), timeout)
        promise
            .then(value => {
                globalThis.clearTimeout(timer)
                resolve(value)
            })
            .catch(error => {
                globalThis.clearTimeout(timer)
                reject(error)
            })
    })

const waitForVideoReady = (video: HTMLVideoElement): Promise<void> =>
    new Promise((resolve, reject) => {
        if (video.readyState >= 2) {
            resolve()
            return
        }

        const onLoaded = () => {
            cleanup()
            resolve()
        }
        const onError = () => {
            cleanup()
            reject(new Error('video load failed'))
        }
        const cleanup = () => {
            video.removeEventListener('loadeddata', onLoaded)
            video.removeEventListener('error', onError)
        }

        video.addEventListener('loadeddata', onLoaded, { once: true })
        video.addEventListener('error', onError, { once: true })
    })

const canvasToBlob = (canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.9): Promise<Blob> =>
    new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => {
                if (!blob) {
                    reject(new Error('video frame blob generation failed'))
                    return
                }
                resolve(blob)
            },
            type,
            quality
        )
    })

const resolveMediaResourceUrl = (url: string): string => {
    const raw = String(url || '').trim()
    if (!raw) return ''
    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('blob:') || raw.startsWith('data:')) return raw
    const fileBaseUrl = toStringOrUndefined((import.meta as any)?.env?.VITE_APP_FILE_BASE_URL)
    if (fileBaseUrl) return `${fileBaseUrl.replace(/\/$/, '')}/${raw.replace(/^\//, '')}`
    if (typeof window !== 'undefined' && raw.startsWith('/')) return `${window.location.origin}${raw}`
    return raw
}

export const buildVideoCoverFile = async (source: { mediaUrl?: string; file?: File }): Promise<File | null> => {
    if (typeof document === 'undefined') return null

    let objectUrl: string | null = null
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    try {
        if (source.file instanceof File) {
            objectUrl = URL.createObjectURL(source.file)
            video.src = objectUrl
        } else {
            const mediaUrl = resolveMediaResourceUrl(String(source.mediaUrl || ''))
            if (!mediaUrl) return null
            video.src = mediaUrl
        }

        await withTimeout(waitForVideoReady(video))

        const width = video.videoWidth || 720
        const height = video.videoHeight || 1280
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const context = canvas.getContext('2d')
        if (!context) throw new Error('cannot get canvas context')
        context.drawImage(video, 0, 0, width, height)

        const blob = await withTimeout(canvasToBlob(canvas))
        return new File([blob], `video-cover-${Date.now()}.jpg`, { type: 'image/jpeg' })
    } finally {
        video.pause()
        video.removeAttribute('src')
        try {
            video.load()
        } catch {
            // noop
        }
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl)
        }
    }
}
