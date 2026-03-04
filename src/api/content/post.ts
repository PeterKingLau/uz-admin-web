import request from '@/utils/request'
import { buildVideoCoverFile, normalizeMediaUrls, normalizeStoragePath } from '@/utils/content/postMedia'
import { getPostUploadCredentials, uploadFilesToOss } from '@/utils/content/ossUpload'
import type { OssCredentialType, UploadCredentialParams } from '@/utils/content/ossUpload'

const POST_CREATE_URL = '/content/postInfo/create'
const REQUEST_TIMEOUT = 300000
const VIDEO_POST_TYPE = '3'
const IMAGE_POST_TYPE = '2'

interface CreatePostPayload {
    postType: string
    content: string
    mediaUrls: string[]
    originalPostId: number | string
    tags: string
    circleId: string
    isQuestion: string
}

export interface AddPostPayload {
    postType: string
    content: string
    tagStr?: string
    tags?: string
    files?: File[]
    coverFile?: File | null
    mediaUrls?: string | string[]
    originalPostId?: number | string
    circleId?: string | number
    isQuestion?: string | number | boolean
    ossType?: OssCredentialType | string
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

const toStringOrEmpty = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    return String(value)
}

const normalizeIsQuestion = (value: AddPostPayload['isQuestion']): string => {
    if (typeof value === 'boolean') return value ? '1' : '0'
    if (value === null || value === undefined || value === '') return '0'
    return String(value)
}

export { getPostUploadCredentials, uploadFilesToOss }
export type { OssCredentialType, UploadCredentialParams }

export async function addPost(data: AddPostPayload) {
    const files = Array.isArray(data.files) ? data.files.filter(file => file instanceof File) : []
    const customCoverFile = data.coverFile instanceof File ? data.coverFile : null
    const customMediaUrls = normalizeMediaUrls(data.mediaUrls)
    const shouldUploadMediaFiles = !customMediaUrls.length && files.length > 0
    const uploadedMediaUrls = shouldUploadMediaFiles ? await uploadFilesToOss(data.postType, files, data.ossType) : []
    const rawMediaUrls = customMediaUrls.length ? customMediaUrls : uploadedMediaUrls
    let mediaUrls = rawMediaUrls.map(normalizeStoragePath).filter(Boolean)
    const normalizedPostType = toStringOrEmpty(data.postType)

    if (normalizedPostType === VIDEO_POST_TYPE && mediaUrls.length) {
        const videoUrl = mediaUrls.length >= 2 ? mediaUrls[1] : mediaUrls[0]
        let coverUrl = mediaUrls.length >= 2 ? mediaUrls[0] : ''

        if (!coverUrl) {
            const videoFile = files.find(f => f instanceof File && /\.(mp4|mov|webm|avi|mkv)$/i.test(f.name || ''))
            const coverFile = customCoverFile || (await buildVideoCoverFile({ file: videoFile, mediaUrl: videoUrl }))
            if (!coverFile) throw new Error('视频封面生成失败')
            const coverUrls = await uploadFilesToOss(IMAGE_POST_TYPE, [coverFile], data.ossType)
            const uploadedCover = String(coverUrls?.[0] || '').trim()
            if (!uploadedCover) throw new Error('视频封面上传失败')
            coverUrl = normalizeStoragePath(uploadedCover)
        }

        mediaUrls = [coverUrl, videoUrl].filter(Boolean)
    }

    const payload: CreatePostPayload = {
        postType: normalizedPostType,
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
