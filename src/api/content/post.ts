import request from '@/utils/request'

export interface AddPostPayload {
    postType: string
    content: string
    tagStr?: string
    files?: File[]
    mediaUrls?: string
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

export function addPost(data: AddPostPayload) {
    const formData = new FormData()

    formData.append('postType', data.postType)
    formData.append('content', data.content || '')
    formData.append('tagStr', data.tagStr || '')
    if (data.mediaUrls) {
        formData.append('mediaUrls', data.mediaUrls)
    }

    data.files?.forEach(file => {
        formData.append('files', file)
    })

    return request({
        url: '/content/postInfo/app/v1/addPost',
        method: 'post',
        data: formData,
        timeout: 300000
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
}): Promise<any> {
    return request({
        url: '/content/postInfo/app/v1/listByApp',
        method: 'get',
        params
    }) as unknown as Promise<any>
}

export function listPostByLike(params: {
    lastId?: number | string
    lastCreateTime?: string
    limit?: number
    targetUserId?: number | string
}): Promise<any> {
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
