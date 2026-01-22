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

export interface AddCollectionPayload {
    title: string
    coverUrl?: string
    description?: string
    sortType: number
}

export interface UpdateCollectionPayload {
    id: number
    title?: string
    coverUrl?: string
    description?: string
    sortType?: number
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
    sortType?: number
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
