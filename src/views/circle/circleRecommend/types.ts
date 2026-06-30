export interface PostItem {
    id: string | number
    title: string
    content?: string
    authorId?: string | number
    authorName?: string
    authorAvatar?: string
    images?: string[]
    videoUrl?: string
    postType?: string
    isTop?: boolean
    likeCount?: number
    isLiked?: boolean
    like?: boolean
    commentCount?: number
    isCollected?: boolean
    bookmark?: boolean
    bookmarkCount?: number
    collectCount?: number
    shareCount?: number
    repostCount?: number
    createTime?: string
    updateTime?: string
}
