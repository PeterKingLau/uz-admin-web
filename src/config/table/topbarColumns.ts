export const TOPBAR_TABLE_KEY = 'topbarConfig'

export const TOPBAR_COLUMNS = [
    {
        key: 'selection',
        type: 'selection',
        width: 55,
        align: 'center'
    },
    {
        key: 'index',
        type: 'index',
        label: '序号',
        width: 60,
        align: 'center'
    },
    {
        key: 'code',
        label: '导航编码',
        prop: 'code',
        showOverflowTooltip: true
    },
    {
        key: 'name',
        label: '导航名称',
        prop: 'name',
        showOverflowTooltip: true
    },
    {
        key: 'sort',
        label: '排序',
        prop: 'sort',
        width: 100,
        align: 'center'
    },
    {
        key: 'isActive',
        label: '状态',
        prop: 'isActive',
        width: 120,
        align: 'center',
        slot: 'status'
    },
    {
        key: 'actions',
        label: '操作',
        width: 160,
        align: 'center',
        slot: 'actions',
        className: 'small-padding fixed-width'
    }
]
