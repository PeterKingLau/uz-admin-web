import request from '@/utils/request'

export interface AddPostPayload {
    postType: string
    content: string
    tagStr?: string
    files?: File[]
    mediaUrls?: string
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

export function deletePost(params: { postIds: Array<string | number> }) {
    const postIds = Array.isArray(params.postIds) ? params.postIds : params.postIds ? [params.postIds] : []
    const idPath = postIds.join(',')
    return request({
        url: `/content/postInfo/deletePost/${idPath}`,
        method: 'delete'
    })
}
