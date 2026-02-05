import axios from 'axios'
import request from '@/utils/request'

const POST_UPLOAD_CREDENTIALS_URL = '/content/postInfo/upload/credentials'
const POST_CREATE_URL = '/content/postInfo/create'
const REQUEST_TIMEOUT = 300000

type UnknownRecord = Record<string, unknown>

interface CreatePostPayload {
    postType: string
    content: string
    mediaUrls: string[]
    originalPostId: number | string
    tags: string
    circleId: string
    isQuestion: string
}

interface UploadCredentialParams {
    postType?: string
    fileCount?: string | number
    type?: string
}

export interface AddPostPayload {
    postType: string
    content: string
    tagStr?: string
    tags?: string
    files?: File[]
    mediaUrls?: string | string[]
    originalPostId?: number | string
    circleId?: string | number
    isQuestion?: string | number | boolean
    ossType?: string
}

export interface UpdatePostTagPayload {
    postId: number | string
    tagStr: string
}

export interface LikePostPayload {
    postId: number | string
    targetUserId: number | string
}

export interface BookmarkPostPayload {
    postId: number | string
    targetUserId: number | string
}

export interface AddCommentPayload {
    postId: number | string
    content: string
    targetUserId: number | string
    parentCommentId?: number | string
    replyUserId?: number | string
}

export interface RepostPostPayload {
    originalPostId: number | string
    content: string
}

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value)

const toStringOrEmpty = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    return String(value)
}

const toStringOrUndefined = (value: unknown): string | undefined => {
    if (value === null || value === undefined) return undefined
    if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed ? trimmed : undefined
    }
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    return undefined
}

const firstString = (...values: unknown[]): string | undefined => {
    for (const item of values) {
        const value = toStringOrUndefined(item)
        if (value) return value
    }
    return undefined
}

const stripUrlQuery = (url: string): string => {
    const queryIndex = url.indexOf('?')
    const hashIndex = url.indexOf('#')
    const splitIndex = queryIndex === -1 ? hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex)
    return splitIndex === -1 ? url : url.slice(0, splitIndex)
}

const ensureAbsoluteUrl = (url: string): string => {
    const trimmed = url.trim()
    if (!trimmed) return trimmed
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    if (trimmed.startsWith('//')) return `https:${trimmed}`
    if (trimmed.startsWith('/')) return trimmed
    return `https://${trimmed}`
}

const toBase64 = (input: string): string => {
    if (typeof btoa === 'function') {
        const bytes = new TextEncoder().encode(input)
        let binary = ''
        bytes.forEach(b => {
            binary += String.fromCharCode(b)
        })
        return btoa(binary)
    }
    throw new Error('当前环境不支持 Base64 编码')
}

const bufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    bytes.forEach(b => {
        binary += String.fromCharCode(b)
    })
    if (typeof btoa === 'function') return btoa(binary)
    throw new Error('当前环境不支持 Base64 编码')
}

const signHmacSha1 = async (secret: string, message: string): Promise<string> => {
    const cryptoObj = globalThis.crypto
    if (!cryptoObj?.subtle) {
        throw new Error('当前环境不支持 HMAC-SHA1 签名')
    }
    const key = await cryptoObj.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
    const signature = await cryptoObj.subtle.sign('HMAC', key, new TextEncoder().encode(message))
    return bufferToBase64(signature)
}

const normalizeMediaUrls = (mediaUrls?: string | string[]): string[] => {
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

const normalizeIsQuestion = (value: AddPostPayload['isQuestion']): string => {
    if (typeof value === 'boolean') return value ? '1' : '0'
    if (value === null || value === undefined || value === '') return '0'
    return String(value)
}

const appendFormField = (target: Record<string, string>, key: string, value: unknown) => {
    const normalized = toStringOrUndefined(value)
    if (!normalized) return
    target[key] = normalized
}

const collectFormFields = (credential: UnknownRecord): Record<string, string> => {
    const fields: Record<string, string> = {}
    const nestedFields = [credential.formData, credential.fields, credential.formFields, credential.params]
    nestedFields.forEach(item => {
        if (!isRecord(item)) return
        Object.entries(item).forEach(([key, value]) => {
            appendFormField(fields, key, value)
        })
    })

    appendFormField(fields, 'key', credential.key)
    appendFormField(fields, 'policy', credential.policy)
    appendFormField(fields, 'callback', credential.callback)
    appendFormField(fields, 'success_action_status', credential.success_action_status)
    appendFormField(fields, 'OSSAccessKeyId', credential.OSSAccessKeyId ?? credential.accessId ?? credential.accessKeyId)
    appendFormField(fields, 'signature', credential.signature ?? credential.Signature)
    appendFormField(fields, 'x-oss-security-token', credential['x-oss-security-token'] ?? credential.securityToken ?? credential.SecurityToken)
    appendFormField(fields, 'OSSAccessKeyId', credential.accessKeyId)

    Object.entries(credential).forEach(([key, value]) => {
        if (!key.startsWith('x-oss-')) return
        appendFormField(fields, key, value)
    })

    return fields
}

const normalizeOssTokenField = (fields: Record<string, string>): void => {
    if (fields['x-oss-security-token']) return
    const nestedToken = (fields as UnknownRecord).x
    if (!isRecord(nestedToken)) return
    const oss = nestedToken.oss
    if (!isRecord(oss)) return
    const security = oss.security
    if (!isRecord(security)) return
    const token = toStringOrUndefined(security.token)
    if (!token) return
    fields['x-oss-security-token'] = token
    delete (fields as UnknownRecord).x
}

const buildObjectKey = (credential: UnknownRecord, file: File, index: number): string | undefined => {
    const fileName = file.name || `file_${index}`
    const templateKey = firstString(credential.key, credential.objectKey)
    if (templateKey) {
        if (templateKey.includes('${filename}')) {
            return templateKey.replaceAll('${filename}', fileName)
        }
        return templateKey
    }

    const dir = firstString(credential.dir, credential.prefix)
    if (!dir) return undefined
    const normalizedDir = dir.endsWith('/') ? dir : `${dir}/`
    const extensionIndex = fileName.lastIndexOf('.')
    const extension = extensionIndex >= 0 ? fileName.slice(extensionIndex) : ''
    const baseName = extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName
    const safeBaseName =
        baseName
            .replace(/[^\w.-]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '') || 'file'
    return `${normalizedDir}${Date.now()}_${index}_${safeBaseName}${extension}`
}

const resolveCredentialList = (response: unknown): unknown[] => {
    const payload = isRecord(response) && 'data' in response ? (response as UnknownRecord).data : response
    if (Array.isArray(payload)) return payload
    if (!isRecord(payload)) return []

    const listKeys = ['credentials', 'credentialList', 'list', 'items', 'records', 'uploadCredentials']
    for (const key of listKeys) {
        const value = payload[key]
        if (Array.isArray(value)) return value
    }

    return [payload]
}

export function getPostUploadCredentials(params: UploadCredentialParams) {
    return request({
        url: POST_UPLOAD_CREDENTIALS_URL,
        method: 'get',
        params,
        timeout: REQUEST_TIMEOUT
    })
}

const uploadByPut = async (targetUrl: string, file: File, credential: UnknownRecord): Promise<string> => {
    const resolvedTarget = ensureAbsoluteUrl(targetUrl)
    const headers: Record<string, string> = {}
    const customHeaders = credential.headers
    if (isRecord(customHeaders)) {
        Object.entries(customHeaders).forEach(([key, value]) => {
            const normalized = toStringOrUndefined(value)
            if (!normalized) return
            headers[key] = normalized
        })
    }
    if (!headers['Content-Type'] && !headers['content-type'] && file.type) {
        headers['Content-Type'] = file.type
    }

    const response = await axios.put(resolvedTarget, file, { headers, timeout: REQUEST_TIMEOUT, withCredentials: false })
    const responseData = response?.data
    const responseDataObj = isRecord(responseData) ? responseData : undefined
    const nestedData = responseDataObj?.data
    const nestedObj = isRecord(nestedData) ? nestedData : undefined

    return (
        firstString(
            credential.fileUrl,
            credential.fileURL,
            credential.publicUrl,
            credential.resourceUrl,
            responseDataObj?.url,
            responseDataObj?.fileUrl,
            nestedObj?.url,
            nestedObj?.fileUrl
        ) || stripUrlQuery(resolvedTarget)
    )
}

const uploadByPost = async (host: string, file: File, credential: UnknownRecord, index: number, presetFields?: Record<string, string>): Promise<string> => {
    const resolvedHost = ensureAbsoluteUrl(host)
    const formFields = presetFields ? { ...presetFields } : collectFormFields(credential)
    normalizeOssTokenField(formFields)
    if (!formFields.key) {
        const key = buildObjectKey(credential, file, index)
        if (key) formFields.key = key
    }

    const formData = new FormData()
    Object.entries(formFields).forEach(([key, value]) => {
        formData.append(key, value)
    })
    formData.append('file', file)

    const response = await axios.post(resolvedHost, formData, {
        timeout: REQUEST_TIMEOUT,
        withCredentials: false
    })

    const responseData = response?.data
    const responseDataObj = isRecord(responseData) ? responseData : undefined
    const nestedData = responseDataObj?.data
    const nestedObj = isRecord(nestedData) ? nestedData : undefined

    const credentialUrl = firstString(credential.fileUrl, credential.fileURL, credential.publicUrl, credential.resourceUrl)
    if (credentialUrl) return credentialUrl

    const responseUrl = firstString(responseDataObj?.url, responseDataObj?.fileUrl, nestedObj?.url, nestedObj?.fileUrl)
    if (responseUrl) return responseUrl

    const key = formFields.key
    if (!key) return stripUrlQuery(resolvedHost)
    return `${resolvedHost.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`
}

const buildOssStsFields = async (credential: UnknownRecord, file: File, index: number): Promise<{ host: string; fields: Record<string, string> }> => {
    const accessKeyId = firstString(credential.accessKeyId)
    const accessKeySecret = firstString(credential.accessKeySecret)
    const securityToken = firstString(credential.securityToken)
    const endpoint = firstString(credential.endpoint)
    const bucketName = firstString(credential.bucketName)
    const uploadDir = firstString(credential.uploadDir) || ''
    const prefix = firstString(credential.prefix) || ''

    if (!accessKeyId || !accessKeySecret || !endpoint || !bucketName) {
        throw new Error('OSS 凭证字段缺失')
    }

    const fileName = file.name || `file_${index}`
    const normalizedDir = uploadDir.endsWith('/') || uploadDir === '' ? uploadDir : `${uploadDir}/`
    const objectKey = `${normalizedDir}${prefix}${fileName}`

    const expireTime = Number(credential.expireTime || 0)
    const expiration = new Date((expireTime > 0 ? expireTime : Math.floor(Date.now() / 1000) + 3600) * 1000).toISOString()

    const maxSize = Number(credential.maxFileSize || 0)
    const policy = {
        expiration,
        conditions: [
            ['starts-with', '$key', normalizedDir],
            ['content-length-range', 0, maxSize > 0 ? maxSize : 104857600]
        ]
    }

    const policyBase64 = toBase64(JSON.stringify(policy))
    const signature = await signHmacSha1(accessKeySecret, policyBase64)

    const host = `https://${bucketName}.${endpoint}`
    const fields: Record<string, string> = {
        key: objectKey,
        policy: policyBase64,
        OSSAccessKeyId: accessKeyId,
        signature,
        success_action_status: '200'
    }
    if (securityToken) fields['x-oss-security-token'] = securityToken

    return { host, fields }
}

const uploadSingleFile = async (file: File, credentialRaw: unknown, index: number): Promise<string> => {
    const credential = isRecord(credentialRaw) ? credentialRaw : {}

    const method = firstString(credential.method)?.toUpperCase()
    const putTarget = firstString(credential.putUrl, credential.signedUrl, credential.presignedUrl)
    const uploadUrl = firstString(credential.uploadUrl, credential.url)
    const host = firstString(credential.host, credential.uploadHost, credential.endpoint)
    const hasPostPolicy = Boolean(firstString(credential.policy, credential.signature, credential.Signature))
    const hasStsSecret = Boolean(firstString(credential.accessKeyId) && firstString(credential.accessKeySecret))

    if (putTarget || method === 'PUT' || (!hasPostPolicy && uploadUrl)) {
        const target = putTarget || uploadUrl
        if (!target) throw new Error('缺少 OSS PUT 上传地址')
        return uploadByPut(target, file, credential)
    }

    if (!hasPostPolicy && hasStsSecret) {
        const { host: ossHost, fields } = await buildOssStsFields(credential, file, index)
        return uploadByPost(ossHost, file, credential, index, fields)
    }

    const postHost = host || uploadUrl
    if (!postHost) {
        throw new Error('缺少 OSS 上传地址')
    }
    return uploadByPost(postHost, file, credential, index)
}

const uploadFilesToOss = async (postType: string, files: File[], ossType?: string): Promise<string[]> => {
    if (!files.length) return []
    const credentialResponse = await getPostUploadCredentials({
        postType,
        fileCount: String(files.length),
        type: ossType
    })
    const credentialList = resolveCredentialList(credentialResponse)
    if (!credentialList.length) {
        throw new Error('未获取到 OSS 上传凭证')
    }

    const uploadedUrls: string[] = []
    for (let index = 0; index < files.length; index += 1) {
        const credential = credentialList[index] ?? credentialList[0]
        const uploadedUrl = await uploadSingleFile(files[index], credential, index)
        if (!uploadedUrl) {
            throw new Error(`第 ${index + 1} 个文件上传失败，未返回文件地址`)
        }
        uploadedUrls.push(uploadedUrl)
    }
    return uploadedUrls
}

export async function addPost(data: AddPostPayload) {
    const files = Array.isArray(data.files) ? data.files.filter(file => file instanceof File) : []
    const customMediaUrls = normalizeMediaUrls(data.mediaUrls)
    const uploadedMediaUrls = files.length ? await uploadFilesToOss(data.postType, files, data.ossType) : []
    const mediaUrls = uploadedMediaUrls.length ? uploadedMediaUrls : customMediaUrls

    const payload: CreatePostPayload = {
        postType: toStringOrEmpty(data.postType),
        content: toStringOrEmpty(data.content).trim(),
        mediaUrls,
        originalPostId: data.originalPostId ?? 0,
        tags: toStringOrEmpty(data.tags ?? data.tagStr).trim(),
        circleId: toStringOrEmpty(data.circleId),
        isQuestion: normalizeIsQuestion(data.isQuestion)
    }

    return request({
        url: POST_CREATE_URL,
        method: 'post',
        data: payload,
        timeout: REQUEST_TIMEOUT
    })
}

export function updatePostTag(data: UpdatePostTagPayload) {
    const formData = new FormData()

    formData.append('postId', String(data.postId ?? ''))
    formData.append('tagStr', data.tagStr || '')

    return request({
        url: '/content/postInfo/updatePostTag',
        method: 'post',
        data: formData
    })
}

export function listPostByApp(params: {
    postType?: string
    lastId?: number | string
    lastCreateTime?: string
    limit?: number
    content?: string
    targetUserId?: number | string
    circleId?: number | string
    isCircle?: number | string
}): Promise<any> {
    return request({
        url: '/content/postInfo/app/v1/listByApp',
        method: 'get',
        params
    }) as unknown as Promise<any>
}

export function listPostByLike(params: { lastId?: number | string; lastCreateTime?: string; limit?: number; targetUserId?: number | string }): Promise<any> {
    return request({
        url: '/content/postInfo/app/v1/listByLike',
        method: 'get',
        params
    }) as unknown as Promise<any>
}

export function listPostByBookMark(params: {
    lastId?: number | string
    lastCreateTime?: string
    limit?: number
    targetUserId?: number | string
}): Promise<any> {
    return request({
        url: '/content/postInfo/app/v1/listByBookMark',
        method: 'get',
        params
    }) as unknown as Promise<any>
}

export function likePost(data: LikePostPayload): Promise<any> {
    return request({
        url: '/content/postInfo/app/v1/likePost',
        method: 'post',
        data
    }) as unknown as Promise<any>
}

export function bookmarkPost(data: BookmarkPostPayload): Promise<any> {
    return request({
        url: '/content/postInfo/app/v1/bookmarkPost',
        method: 'post',
        data
    }) as unknown as Promise<any>
}

export function addComment(data: AddCommentPayload): Promise<any> {
    return request({
        url: '/content/postInfo/app/v1/addComment',
        method: 'post',
        data
    }) as unknown as Promise<any>
}

export function repostPost(data: RepostPostPayload): Promise<any> {
    const formData = new FormData()
    formData.append('originalPostId', String(data.originalPostId ?? ''))
    formData.append('content', String(data.content ?? ''))
    return request({
        url: '/content/postInfo/app/v1/repost',
        method: 'post',
        data: formData
    }) as unknown as Promise<any>
}

export function deletePost(params: { postIds: Array<string | number> }) {
    const postIds = Array.isArray(params.postIds) ? params.postIds : params.postIds ? [params.postIds] : []
    const idPath = postIds.join(',')
    return request({
        url: `/content/postInfo/deletePost/${idPath}`,
        method: 'delete'
    })
}

export function pinPostManually(params: { postId?: number | string; days?: number }) {
    return request({
        url: '/content/hotPost/pinPostManually',
        method: 'get',
        params
    })
}

export function unpinPostManually(params: { postId?: number | string }) {
    return request({
        url: '/content/hotPost/unpinPostManually',
        method: 'get',
        params
    })
}
