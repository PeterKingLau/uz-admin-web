import request from '@/utils/request'

export interface AddPostPayload {
    postType: string
    content: string
    tagStr?: string
    files?: File[]
}

export function addPost(data: AddPostPayload) {
    const formData = new FormData()

    formData.append('postType', data.postType)
    formData.append('content', data.content || '')
    formData.append('tagStr', data.tagStr || '')

    data.files?.forEach(file => {
        formData.append('files', file)
    })

    return request({
        url: 'content/postInfo/app/v1/addPost',
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
}) {
    return request({
        url: '/content/postInfo/app/v1/listByApp',
        method: 'get',
        params
    })
}
