export const CONTENT_AUDIT_TABLE_KEY = 'contentAudit'

export const CONTENT_AUDIT_COLUMNS = [
    {
        key: 'selection',
        type: 'selection',
        width: 55,
        align: 'center',
        fixed: 'left'
    },
    {
        key: 'nickName',
        label: '用户昵称',
        prop: 'nickName',
        width: 140,
        showOverflowTooltip: true
    },
    {
        key: 'postType',
        label: '帖子类型',
        prop: 'postType',
        width: 100,
        align: 'center',
        slot: 'postType'
    },
    {
        key: 'content',
        label: '内容',
        prop: 'content',
        minWidth: 220,
        showOverflowTooltip: true
    },
    {
        key: 'media',
        label: '图片/视频',
        minWidth: 220,
        slot: 'media'
    },
    {
        key: 'status',
        label: '内容状态',
        prop: 'status',
        width: 100,
        align: 'center',
        slot: 'status'
    },
    {
        key: 'auditStatus',
        label: '审核状态',
        prop: 'auditStatus',
        width: 120,
        align: 'center',
        slot: 'auditStatus'
    },
    {
        key: 'reason',
        label: '审核理由',
        prop: 'reason',
        minWidth: 180,
        showOverflowTooltip: true
    },
    {
        key: 'createTime',
        label: '创建时间',
        prop: 'createTime',
        minWidth: 180,
        showOverflowTooltip: true
    },
    {
        key: 'operations',
        label: '操作',
        width: 220,
        align: 'center',
        fixed: 'right',
        className: 'small-padding fixed-width',
        slot: 'operations'
    }
]
