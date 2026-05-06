import request from '@/utils/request'
import type { ContentAuditQuery, AuditPostData, PageResult, ContentItem } from './content.types'




export function listContentAudit(query: ContentAuditQuery) {
    return request<PageResult<ContentItem>>({
        url: '/content/postInfo/list',
        method: 'get',
        params: query
    })
}




export function auditPost(data: AuditPostData) {
    return request({
        url: '/content/postInfo/auditPost',
        method: 'post',
        data
    })
}
