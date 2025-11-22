export const PROFILE_AUDIT_TABLE_KEY = 'profileAudit'

export const PROFILE_AUDIT_COLUMNS = [
    {
        key: 'selection',
        type: 'selection',
        width: 55,
        align: 'center',
        fixed: 'left'
    },
    {
        key: 'userName',
        label: '用户名',
        prop: 'userName',
        width: 140,
        fixed: 'left',
        showOverflowTooltip: true
    },
    {
        key: 'nickName',
        label: '昵称',
        prop: 'nickName',
        width: 140,
        showOverflowTooltip: true
    },
    {
        key: 'applyType',
        label: '资料类型',
        prop: 'applyType',
        width: 120,
        showOverflowTooltip: true
    },
    {
        key: 'oldValue',
        label: '原数据',
        prop: 'oldValue',
        minWidth: 180,
        slot: 'oldValue'
    },
    {
        key: 'newValue',
        label: '新数据',
        prop: 'newValue',
        minWidth: 180,
        slot: 'newValue'
    },
    {
        key: 'auditStatus',
        label: '审核状态',
        prop: 'auditStatus',
        width: 100,
        align: 'center',
        slot: 'auditStatus'
    },
    {
        key: 'auditRemark',
        label: '审核备注',
        prop: 'auditRemark',
        minWidth: 180,
        showOverflowTooltip: true,
        slot: 'auditRemark'
    },
    {
        key: 'auditBy',
        label: '审核人',
        prop: 'auditBy',
        width: 120,
        showOverflowTooltip: true
    },
    {
        key: 'applyTime',
        label: '申请时间',
        prop: 'applyTime',
        width: 160,
        align: 'center'
    },
    {
        key: 'auditTime',
        label: '审核时间',
        prop: 'auditTime',
        width: 160,
        align: 'center'
    },
    {
        key: 'operations',
        label: '操作',
        width: 120,
        align: 'center',
        fixed: 'right',
        className: 'small-padding fixed-width',
        slot: 'operations'
    }
]
