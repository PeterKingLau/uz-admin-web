import request from '@/utils/request'
import type {
    AddCollectionPayload,
    AddPostToCollectionPayload,
    GetPostByCollectionParams,
    RemovePostFromCollectionPayload,
    UpdateCollectionPayload
} from './collection.types'

export function listMyCollections(params?: Record<string, any>): Promise<any> {
    return request({
        url: '/content/collection/myCollections',
        method: 'get',
        params
    }) as unknown as Promise<any>
}

export function addCollection(data: AddCollectionPayload): Promise<any> {
    return request({
        url: '/content/collection/add',
        method: 'post',
        data
    }) as unknown as Promise<any>
}

export function updateCollection(data: UpdateCollectionPayload): Promise<any> {
    return request({
        url: '/content/collection/update',
        method: 'post',
        data
    }) as unknown as Promise<any>
}

export function deleteCollections(ids: Array<number | string> | number | string): Promise<any> {
    const idList = Array.isArray(ids) ? ids : [ids]
    const path = idList.join(',')
    return request({
        url: `/content/collection/${path}`,
        method: 'delete'
    }) as unknown as Promise<any>
}

export function addPostToCollection(data: AddPostToCollectionPayload): Promise<any> {
    return request({
        url: '/content/collection/addPostToCollection',
        method: 'post',
        data
    }) as unknown as Promise<any>
}

export function getPostByCollection(params: GetPostByCollectionParams): Promise<any> {
    return request({
        url: '/content/collection/getPostByCollection',
        method: 'get',
        params
    }) as unknown as Promise<any>
}

export function removePostFromCollectionBatch(data: RemovePostFromCollectionPayload): Promise<any> {
    return request({
        url: '/content/collection/remove/posts/batch',
        method: 'post',
        data
    }) as unknown as Promise<any>
}

export function uploadCollectionCover(file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    return request({
        url: '/common/upload',
        method: 'post',
        data: formData
    }) as unknown as Promise<any>
}
