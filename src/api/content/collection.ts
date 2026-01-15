import request from '@/utils/request'

export interface CollectionItem {
    id: number
    title: string
    coverUrl?: string
    description?: string
    sortType?: number
    count?: number
    createTime?: string
    updateTime?: string
}

export function listMyCollections(): Promise<any> {
    return request({
        url: '/content/collection/myCollections',
        method: 'get'
    }) as unknown as Promise<any>
}

export interface AddCollectionPayload {
    title: string
    coverUrl?: string
    description?: string
    sortType: number
}

export function addCollection(data: AddCollectionPayload): Promise<any> {
    return request({
        url: '/content/collection/add',
        method: 'post',
        data
    }) as unknown as Promise<any>
}

export interface UpdateCollectionPayload {
    id: number
    title?: string
    coverUrl?: string
    description?: string
    sortType?: number
}

export function updateCollection(data: UpdateCollectionPayload): Promise<any> {
    return request({
        url: '/content/collection/update',
        method: 'post',
        data
    }) as unknown as Promise<any>
}

export interface DeleteCollectionPayload {
    ids: Array<number | string>
}

export interface AddPostToCollectionItem {
    postId: number
    sortOrder: number
}

export interface AddPostToCollectionPayload {
    collectionId: number | string
    items: AddPostToCollectionItem[]
}

export interface GetPostByCollectionParams {
    collectionId: number | string
}

export interface RemovePostFromCollectionItem {
    postId: number
}

export interface RemovePostFromCollectionPayload {
    collectionId: number | string
    items: RemovePostFromCollectionItem[]
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
