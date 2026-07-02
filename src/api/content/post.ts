import request from '@/utils/request'
import type { AxiosRequestConfig } from 'axios'
import { buildVideoCoverFile, normalizeMediaUrls, normalizeStoragePath } from '@/utils/content/postMedia'
import { getPostUploadCredentials, uploadFilesToOss, uploadFilesToOssSettled } from '@/utils/content/ossUpload'
import type { OssCredentialType, OssUploadSettledResult, UploadCredentialParams } from '@/utils/content/ossUpload'
import type {
    AddCommentPayload,
    AddPostPayload,
    BookmarkPostPayload,
    CreatePostResponse,
    CreatePostPayload,
    DeletePostResponse,
    DeletePostParams,
    LikePostPayload,
    ListPostResponse,
    ListPostByAppParams,
    ListPostByBookMarkParams,
    ListPostByLikeParams,
    PostActionResponse,
    RecommendFeedParams,
    PinPostManuallyParams,
    RepostPostPayload,
    TogglePostActionResponse,
    UnpinPostManuallyParams,
    UpdatePostTagPayload
} from './post.types'

export type {
    AddCommentPayload,
    AddPostPayload,
    BookmarkPostPayload,
    ContentPostItem,
    ContentPostTag,
    ContentPostAuthor,
    CreatePostResponse,
    CreatePostPayload,
    DeletePostResponse,
    DeletePostParams,
    LikePostPayload,
    ListPostResponse,
    ListPostByAppParams,
    ListPostByBookMarkParams,
    ListPostByLikeParams,
    PostActionResponse,
    PostId,
    RecommendFeedParams,
    PinPostManuallyParams,
    RepostPostPayload,
    TogglePostActionResponse,
    UnpinPostManuallyParams,
    UpdatePostTagPayload
} from './post.types'
import { getDeviceIdHeader } from '@/utils/deviceId'
const POST_CREATE_URL = '/content/postInfo/create'
const REQUEST_TIMEOUT = 300000
const VIDEO_POST_TYPE = '3'
const IMAGE_POST_TYPE = '2'
type RequestControlConfig = Pick<AxiosRequestConfig, 'headers' | 'signal'> & {
    silentError?: boolean
    skipPending?: boolean
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

export { getPostUploadCredentials, uploadFilesToOss, uploadFilesToOssSettled }
export type { OssCredentialType, OssUploadSettledResult, UploadCredentialParams }

export async function addPost(data: AddPostPayload): Promise<CreatePostResponse> {
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

    return request<CreatePostResponse>({
        url: POST_CREATE_URL,
        method: 'post',
        data: payload,
        timeout: REQUEST_TIMEOUT
    })
}

export function updatePostTag(data: UpdatePostTagPayload): Promise<PostActionResponse> {
    const formData = new FormData()

    formData.append('postId', String(data.postId ?? ''))
    formData.append('tagStr', data.tagStr || '')

    return request<PostActionResponse>({
        url: '/content/postInfo/updatePostTag',
        method: 'post',
        data: formData
    })
}

export function listPostByApp(params: ListPostByAppParams, config: RequestControlConfig = {}): Promise<ListPostResponse> {
    return request<ListPostResponse>({
        ...config,
        url: '/content/postInfo/app/v1/listByApp',
        method: 'get',
        params
    } as any)
}

export function listPostByLike(params: ListPostByLikeParams): Promise<ListPostResponse> {
    return request<ListPostResponse>({
        url: '/content/postInfo/app/v1/listByLike',
        method: 'get',
        params
    })
}

export function listPostByBookMark(params: ListPostByBookMarkParams): Promise<ListPostResponse> {
    return request<ListPostResponse>({
        url: '/content/postInfo/app/v1/listByBookMark',
        method: 'get',
        params
    })
}

export function listRecommendFeed(params: RecommendFeedParams, config: RequestControlConfig = {}): Promise<ListPostResponse> {
    const { headers, ...requestConfig } = config
    return request<ListPostResponse>({
        ...requestConfig,
        url: '/content/postInfo/app/v1/feed/recommend',
        method: 'get',
        params,
        headers: {
            ...getDeviceIdHeader(),
            ...(headers || {})
        }
    } as any)
}

export function likePost(data: LikePostPayload): Promise<TogglePostActionResponse> {
    return request<TogglePostActionResponse>({
        url: '/content/postInfo/app/v1/likePost',
        method: 'post',
        data
    })
}

export function bookmarkPost(data: BookmarkPostPayload): Promise<TogglePostActionResponse> {
    return request<TogglePostActionResponse>({
        url: '/content/postInfo/app/v1/bookmarkPost',
        method: 'post',
        data
    })
}

export function addComment(data: AddCommentPayload): Promise<PostActionResponse> {
    return request<PostActionResponse>({
        url: '/content/postInfo/app/v1/addComment',
        method: 'post',
        data
    })
}

export function repostPost(data: RepostPostPayload): Promise<PostActionResponse> {
    const formData = new FormData()
    formData.append('originalPostId', String(data.originalPostId ?? ''))
    formData.append('content', String(data.content ?? ''))
    return request<PostActionResponse>({
        url: '/content/postInfo/app/v1/repost',
        method: 'post',
        data: formData
    })
}

export function deletePost(params: DeletePostParams): Promise<DeletePostResponse> {
    const postIds = Array.isArray(params.postIds) ? params.postIds : params.postIds ? [params.postIds] : []
    const idPath = postIds.join(',')
    return request<DeletePostResponse>({
        url: `/content/postInfo/deletePost/${idPath}`,
        method: 'delete'
    })
}

export function pinPostManually(params: PinPostManuallyParams): Promise<PostActionResponse> {
    return request<PostActionResponse>({
        url: '/content/hotPost/pinPostManually',
        method: 'get',
        params
    })
}

export function unpinPostManually(params: UnpinPostManuallyParams): Promise<PostActionResponse> {
    return request<PostActionResponse>({
        url: '/content/hotPost/unpinPostManually',
        method: 'get',
        params
    })
}
