import request, { requestOss } from '@/utils/request'

const POST_UPLOAD_CREDENTIALS_URL = '/content/postInfo/upload/credentials'
const REQUEST_TIMEOUT = 300000
const DEFAULT_OSS_CREDENTIAL_TYPE = 'posts'
const VALID_OSS_CREDENTIAL_TYPES = ['posts', 'collections', 'circles', 'templates'] as const

type UnknownRecord = Record<string, unknown>

export type OssCredentialType = (typeof VALID_OSS_CREDENTIAL_TYPES)[number]

export interface UploadCredentialParams {
    postType?: string
    fileCount?: string
    type?: OssCredentialType
}

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value)

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

const normalizeOssCredentialType = (value?: string): OssCredentialType => {
    const normalized = toStringOrUndefined(value)?.toLowerCase()
    if (!normalized) return DEFAULT_OSS_CREDENTIAL_TYPE
    if (VALID_OSS_CREDENTIAL_TYPES.includes(normalized as OssCredentialType)) {
        return normalized as OssCredentialType
    }
    return DEFAULT_OSS_CREDENTIAL_TYPE
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

const encodeUtf8 = (input: string): Uint8Array => {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(input)
    const bytes: number[] = []
    for (let i = 0; i < input.length; i += 1) {
        let codePoint = input.charCodeAt(i)
        if (codePoint >= 0xd800 && codePoint <= 0xdbff && i + 1 < input.length) {
            const low = input.charCodeAt(i + 1)
            if (low >= 0xdc00 && low <= 0xdfff) {
                codePoint = ((codePoint - 0xd800) << 10) + (low - 0xdc00) + 0x10000
                i += 1
            }
        }
        if (codePoint <= 0x7f) {
            bytes.push(codePoint)
        } else if (codePoint <= 0x7ff) {
            bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f))
        } else if (codePoint <= 0xffff) {
            bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f))
        } else {
            bytes.push(0xf0 | (codePoint >> 18), 0x80 | ((codePoint >> 12) & 0x3f), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f))
        }
    }
    return new Uint8Array(bytes)
}

const leftRotate = (value: number, bits: number): number => ((value << bits) | (value >>> (32 - bits))) >>> 0

const sha1Bytes = (message: Uint8Array): Uint8Array => {
    const messageBitLength = message.length * 8
    const withOneBitLength = message.length + 1
    const zeroPaddingLength = (64 - ((withOneBitLength + 8) % 64)) % 64
    const totalLength = withOneBitLength + zeroPaddingLength + 8

    const bytes = new Uint8Array(totalLength)
    bytes.set(message)
    bytes[message.length] = 0x80

    const highBits = Math.floor(messageBitLength / 0x100000000)
    const lowBits = messageBitLength >>> 0
    bytes[totalLength - 8] = (highBits >>> 24) & 0xff
    bytes[totalLength - 7] = (highBits >>> 16) & 0xff
    bytes[totalLength - 6] = (highBits >>> 8) & 0xff
    bytes[totalLength - 5] = highBits & 0xff
    bytes[totalLength - 4] = (lowBits >>> 24) & 0xff
    bytes[totalLength - 3] = (lowBits >>> 16) & 0xff
    bytes[totalLength - 2] = (lowBits >>> 8) & 0xff
    bytes[totalLength - 1] = lowBits & 0xff

    let h0 = 0x67452301
    let h1 = 0xefcdab89
    let h2 = 0x98badcfe
    let h3 = 0x10325476
    let h4 = 0xc3d2e1f0
    const w = new Uint32Array(80)

    for (let offset = 0; offset < bytes.length; offset += 64) {
        for (let i = 0; i < 16; i += 1) {
            const base = offset + i * 4
            w[i] = ((bytes[base] << 24) | (bytes[base + 1] << 16) | (bytes[base + 2] << 8) | bytes[base + 3]) >>> 0
        }
        for (let i = 16; i < 80; i += 1) {
            w[i] = leftRotate(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1)
        }

        let a = h0
        let b = h1
        let c = h2
        let d = h3
        let e = h4

        for (let i = 0; i < 80; i += 1) {
            let f = 0
            let k = 0
            if (i < 20) {
                f = (b & c) | (~b & d)
                k = 0x5a827999
            } else if (i < 40) {
                f = b ^ c ^ d
                k = 0x6ed9eba1
            } else if (i < 60) {
                f = (b & c) | (b & d) | (c & d)
                k = 0x8f1bbcdc
            } else {
                f = b ^ c ^ d
                k = 0xca62c1d6
            }
            const temp = (leftRotate(a, 5) + f + e + k + w[i]) >>> 0
            e = d
            d = c
            c = leftRotate(b, 30)
            b = a
            a = temp
        }

        h0 = (h0 + a) >>> 0
        h1 = (h1 + b) >>> 0
        h2 = (h2 + c) >>> 0
        h3 = (h3 + d) >>> 0
        h4 = (h4 + e) >>> 0
    }

    const output = new Uint8Array(20)
    const words = [h0, h1, h2, h3, h4]
    words.forEach((word, index) => {
        const base = index * 4
        output[base] = (word >>> 24) & 0xff
        output[base + 1] = (word >>> 16) & 0xff
        output[base + 2] = (word >>> 8) & 0xff
        output[base + 3] = word & 0xff
    })
    return output
}

const hmacSha1Bytes = (secret: Uint8Array, message: Uint8Array): Uint8Array => {
    const blockSize = 64
    let key = secret
    if (key.length > blockSize) key = sha1Bytes(key)

    const keyBlock = new Uint8Array(blockSize)
    keyBlock.set(key)

    const innerPad = new Uint8Array(blockSize)
    const outerPad = new Uint8Array(blockSize)
    for (let i = 0; i < blockSize; i += 1) {
        innerPad[i] = keyBlock[i] ^ 0x36
        outerPad[i] = keyBlock[i] ^ 0x5c
    }

    const innerInput = new Uint8Array(blockSize + message.length)
    innerInput.set(innerPad)
    innerInput.set(message, blockSize)
    const innerHash = sha1Bytes(innerInput)

    const outerInput = new Uint8Array(blockSize + innerHash.length)
    outerInput.set(outerPad)
    outerInput.set(innerHash, blockSize)
    return sha1Bytes(outerInput)
}

const signHmacSha1Compat = async (secret: string, message: string): Promise<string> => {
    try {
        return await signHmacSha1(secret, message)
    } catch {
        const signatureBytes = hmacSha1Bytes(encodeUtf8(secret), encodeUtf8(message))
        return bufferToBase64(signatureBytes.buffer.slice(signatureBytes.byteOffset, signatureBytes.byteOffset + signatureBytes.byteLength) as ArrayBuffer)
    }
}

const appendFormField = (target: Record<string, string>, key: string, value: unknown) => {
    const normalized = toStringOrUndefined(value)
    if (!normalized) return
    target[key] = normalized
}

const buildQueryString = (params: Record<string, string>): string =>
    Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key] || '')}`)
        .join('&')

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
    const uniqueSuffix = `${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`
    const extensionIndex = fileName.lastIndexOf('.')
    const extension = extensionIndex >= 0 ? fileName.slice(extensionIndex) : ''
    const baseName = extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName
    const safeBaseName =
        baseName
            .replace(/[^\w.-]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '') || 'file'
    const forceUniqueKey = Boolean((credential as UnknownRecord).__forceUniqueKey)
    const buildUniqueFromTemplate = (key: string): string => {
        const normalizedKey = String(key || '').replace(/^\/+/, '')
        const slashIndex = normalizedKey.lastIndexOf('/')
        const dir = slashIndex >= 0 ? normalizedKey.slice(0, slashIndex + 1) : ''
        const templateFileName = slashIndex >= 0 ? normalizedKey.slice(slashIndex + 1) : normalizedKey
        if (!templateFileName) return `${dir}${uniqueSuffix}_${safeBaseName}${extension}`
        const fileDotIndex = templateFileName.lastIndexOf('.')
        const fileExtension = fileDotIndex >= 0 ? templateFileName.slice(fileDotIndex) : ''
        const fileBaseName = fileDotIndex >= 0 ? templateFileName.slice(0, fileDotIndex) : templateFileName
        const safeFileBaseName =
            fileBaseName
                .replace(/[^\w.-]+/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_+|_+$/g, '') || 'file'
        const nextExtension = fileExtension || extension
        return `${dir}${safeFileBaseName}_${uniqueSuffix}${nextExtension}`
    }
    const templateKey = firstString(credential.key, credential.objectKey)
    if (templateKey) {
        if (templateKey.includes('${filename}') || templateKey.includes('{filename}')) {
            const replaced = templateKey.split('${filename}').join(fileName).split('{filename}').join(fileName)
            return forceUniqueKey ? buildUniqueFromTemplate(replaced) : replaced
        }
        if (templateKey.endsWith('/')) return `${templateKey}${uniqueSuffix}_${safeBaseName}${extension}`
        if (forceUniqueKey) return buildUniqueFromTemplate(templateKey)
        return templateKey
    }

    const uploadDir = firstString(credential.uploadDir, credential.dir) || ''
    const normalizedDir = uploadDir === '' || uploadDir.endsWith('/') ? uploadDir : `${uploadDir}/`
    const filePrefix = firstString(credential.filePrefix, credential.prefix) || ''
    const normalizedPrefix = filePrefix.replace(/^\/+/, '')
    return `${normalizedDir}${normalizedPrefix}${uniqueSuffix}_${safeBaseName}${extension}`
}

const resolveCredentialList = (response: unknown): unknown[] => {
    if (!response) return []

    const unwrapCodeData = (obj: unknown): unknown => {
        if (!isRecord(obj)) return obj
        if ('code' in obj && 'data' in obj) return obj.data
        return obj
    }

    let payload = unwrapCodeData(response)
    if (isRecord(payload)) payload = unwrapCodeData(payload)

    if (Array.isArray(payload)) return payload
    if (!isRecord(payload)) return payload ? [payload] : []

    const listKeys = ['credentials', 'credentialList', 'list', 'items', 'records', 'uploadCredentials']
    for (const key of listKeys) {
        const value = (payload as UnknownRecord)[key]
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

const requestUploadCredentialList = async (postType: string | undefined, fileCount: number, type: OssCredentialType): Promise<unknown[]> => {
    const response = await getPostUploadCredentials({
        postType,
        fileCount: String(fileCount),
        type
    })
    return resolveCredentialList(response)
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

    const responseData = await requestOss({
        url: resolvedTarget,
        method: 'put',
        data: file,
        headers,
        timeout: REQUEST_TIMEOUT
    })
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

const isNetworkOrMethodError = (error: any): boolean => {
    if (!error) return false
    const status = Number(error?.response?.status || 0)
    if (status === 405) return true
    if (error?.message === 'Network Error') return true
    if (error?.code === 'ERR_NETWORK') return true
    return false
}

const getErrorStatus = (error: any): number => Number(error?.response?.status || 0)

const uploadByPost = async (host: string, file: File, credential: UnknownRecord, index: number, presetFields?: Record<string, string>): Promise<string> => {
    const resolvedHost = ensureAbsoluteUrl(host)
    const formFields = presetFields ? { ...presetFields } : collectFormFields(credential)
    const forceUniqueObjectKey = Boolean((credential as UnknownRecord).__forceUniqueKey)
    normalizeOssTokenField(formFields)
    if (!formFields.key || forceUniqueObjectKey) {
        const key = buildObjectKey(credential, file, index)
        if (key) formFields.key = key
    }

    const formData = new FormData()
    Object.entries(formFields).forEach(([key, value]) => {
        formData.append(key, value)
    })
    formData.append('file', file)

    let responseData
    try {
        responseData = await requestOss({
            url: resolvedHost,
            method: 'post',
            data: formData,
            timeout: REQUEST_TIMEOUT,
            withCredentials: false
        })
    } catch (error: any) {
        if (isNetworkOrMethodError(error)) {
            const explicitPut = firstString(credential.putUrl, credential.signedUrl, credential.presignedUrl, credential.uploadUrl, credential.url)
            if (explicitPut) {
                return uploadByPut(explicitPut, file, credential)
            }
            if (!presetFields) {
                const fallbackTarget = formFields.key ? `${resolvedHost.replace(/\/+$/, '')}/${String(formFields.key).replace(/^\/+/, '')}` : ''
                if (fallbackTarget) {
                    return uploadByPut(fallbackTarget, file, credential)
                }
            }
        }
        throw error
    }

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

const buildStsObjectKey = (credential: UnknownRecord, file: File, index: number): string => {
    const uploadDir = firstString(credential.uploadDir, credential.dir) || ''
    const normalizedDir = uploadDir === '' || uploadDir.endsWith('/') ? uploadDir : `${uploadDir}/`
    const filePrefix = firstString(credential.filePrefix, credential.prefix) || ''
    const normalizedPrefix = filePrefix.replace(/^\/+/, '')
    const fileName = file.name || `file_${index}`
    const extensionIndex = fileName.lastIndexOf('.')
    const extension = extensionIndex >= 0 ? fileName.slice(extensionIndex) : ''
    const baseName = extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName
    const safeBaseName =
        baseName
            .replace(/[^\w.-]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '') || 'file'
    return `${normalizedDir}${normalizedPrefix}${Date.now()}_${index}_${safeBaseName}${extension}`
}

const uploadByStsPut = async (credential: UnknownRecord, file: File, index: number): Promise<string> => {
    const accessKeyId = firstString(credential.accessKeyId)!
    const accessKeySecret = firstString(credential.accessKeySecret)!
    const securityToken = firstString(credential.securityToken)
    const rawEndpoint = firstString(credential.endpoint)!
    const bucketName = firstString(credential.bucketName)!

    const objectKey = buildStsObjectKey(credential, file, index)
    const host = rawEndpoint.startsWith('http') ? rawEndpoint : `https://${bucketName}.${rawEndpoint}`
    const resourceUrl = `${host.replace(/\/+$/, '')}/${objectKey}`

    const contentType = file.type || 'application/octet-stream'
    const nowSeconds = Math.floor(Date.now() / 1000)
    const credentialExpireTime = Number(credential.expireTime || 0)
    const maxExpires = credentialExpireTime > 0 ? credentialExpireTime - 5 : nowSeconds + 3600
    const expiresSeconds = Math.min(nowSeconds + 3600, maxExpires)
    if (expiresSeconds <= nowSeconds) {
        throw new Error('OSS upload credential expired, please retry')
    }
    const expires = String(expiresSeconds)
    const stringToSign = `PUT\n\n${contentType}\n${expires}\n/${bucketName}/${objectKey}`
    const signature = await signHmacSha1Compat(accessKeySecret, stringToSign)

    const tokenParams: Array<'security-token' | 'x-oss-security-token' | null> = securityToken ? ['security-token', 'x-oss-security-token'] : [null]

    let lastError: any
    for (const tokenParam of tokenParams) {
        const params: Record<string, string> = {
            OSSAccessKeyId: accessKeyId,
            Expires: expires,
            Signature: signature
        }
        if (securityToken && tokenParam) params[tokenParam] = securityToken

        const signedUrl = `${resourceUrl}?${buildQueryString(params)}`

        try {
            await requestOss({
                url: signedUrl,
                method: 'put',
                data: file,
                headers: { 'Content-Type': contentType },
                timeout: REQUEST_TIMEOUT,
                withCredentials: false
            })
            return objectKey
        } catch (error: any) {
            lastError = error
            if (getErrorStatus(error) !== 403 || tokenParam === tokenParams[tokenParams.length - 1]) {
                throw error
            }
        }
    }

    if (lastError) throw lastError

    return objectKey
}

const buildStsPostFields = async (credential: UnknownRecord, file: File, index: number): Promise<{ host: string; fields: Record<string, string> }> => {
    const accessKeyId = firstString(credential.accessKeyId)!
    const accessKeySecret = firstString(credential.accessKeySecret)!
    const securityToken = firstString(credential.securityToken)
    const rawEndpoint = firstString(credential.endpoint)!
    const bucketName = firstString(credential.bucketName)!

    const objectKey = buildStsObjectKey(credential, file, index)
    const uploadDir = firstString(credential.uploadDir, credential.dir) || ''
    const normalizedDir = uploadDir === '' || uploadDir.endsWith('/') ? uploadDir : `${uploadDir}/`
    const filePrefix = firstString(credential.filePrefix, credential.prefix) || ''
    const normalizedPrefix = filePrefix.replace(/^\/+/, '')
    const keyStartsWith = `${normalizedDir}${normalizedPrefix}`

    const expireTime = Number(credential.expireTime || 0)
    const expiration = new Date((expireTime > 0 ? expireTime : Math.floor(Date.now() / 1000) + 3600) * 1000).toISOString()
    const maxSize = Number(credential.maxFileSize || 0)
    const policy = {
        expiration,
        conditions: [
            ['starts-with', '$key', keyStartsWith],
            ['content-length-range', 0, maxSize > 0 ? maxSize : 104857600]
        ]
    }

    const policyBase64 = toBase64(JSON.stringify(policy))
    const signature = await signHmacSha1Compat(accessKeySecret, policyBase64)

    const host = rawEndpoint.startsWith('http') ? rawEndpoint : `https://${bucketName}.${rawEndpoint}`
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
    const host = firstString(credential.host, credential.uploadHost)
    const hasPostPolicy = Boolean(
        firstString(credential.policy) &&
        firstString(credential.signature, credential.Signature) &&
        firstString(credential.OSSAccessKeyId, credential.accessId, credential.accessKeyId)
    )
    const hasStsSecret = Boolean(
        firstString(credential.accessKeyId) && firstString(credential.accessKeySecret) && firstString(credential.endpoint) && firstString(credential.bucketName)
    )

    if (method === 'PUT' || putTarget) {
        const target = putTarget || uploadUrl
        if (!target) throw new Error('missing OSS PUT upload url')
        return uploadByPut(target, file, credential)
    }

    if (method === 'POST' || hasPostPolicy) {
        const postHost = host || uploadUrl
        if (!postHost) throw new Error('missing OSS POST upload host')
        return uploadByPost(postHost, file, credential, index)
    }

    if (hasStsSecret) {
        try {
            const { host: postHost, fields } = await buildStsPostFields(credential, file, index)
            return await uploadByPost(postHost, file, credential, index, fields)
        } catch (postError: any) {
            const postStatus = getErrorStatus(postError)
            const shouldTryPut = postStatus === 403 || postStatus === 405 || postError?.message === 'Network Error' || postError?.code === 'ERR_NETWORK'
            if (shouldTryPut) {
                return uploadByStsPut(credential, file, index)
            }
            throw postError
        }
    }

    if (uploadUrl) {
        return uploadByPut(uploadUrl, file, credential)
    }

    const postHost = host
    if (!postHost) throw new Error('missing OSS upload host')
    return uploadByPost(postHost, file, credential, index)
}

export const uploadFilesToOss = async (postType: string, files: File[], ossType?: string, credentialFileCount?: number): Promise<string[]> => {
    if (!files.length) return []
    const credentialType = normalizeOssCredentialType(ossType)
    const parsedCredentialCount = Number(credentialFileCount)
    const requestCredentialCount = Number.isFinite(parsedCredentialCount) && parsedCredentialCount > 0 ? Math.floor(parsedCredentialCount) : files.length
    const credentialList = await requestUploadCredentialList(toStringOrUndefined(postType), requestCredentialCount, credentialType)
    if (!credentialList.length) {
        throw new Error('未获取到 OSS 上传凭证')
    }

    const uploadedUrls: string[] = []
    const shouldForceUniqueObjectKey = credentialList.length === 1 && requestCredentialCount > 1
    for (let index = 0; index < files.length; index += 1) {
        const credentialRaw = credentialList[index] ?? credentialList[0]
        const credential = shouldForceUniqueObjectKey && isRecord(credentialRaw) ? { ...credentialRaw, __forceUniqueKey: true } : credentialRaw
        const uploadedUrl = await uploadSingleFile(files[index], credential, index)
        if (!uploadedUrl) {
            throw new Error(`第 ${index + 1} 个文件上传失败，未返回文件地址`)
        }
        uploadedUrls.push(uploadedUrl)
    }
    return uploadedUrls
}
