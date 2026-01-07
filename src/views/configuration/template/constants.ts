export const textMap = {
    templateName: '模板名称',
    templateNamePlaceholder: '请输入模板名称',
    templateCode: '模板编码',
    templateCodePlaceholder: '请输入模板编码',
    templateType: '模板类型',
    status: '状态',
    updateTime: '更新时间',
    search: '搜索',
    reset: '重置',
    add: '新增',
    addTitle: '新增模板',
    edit: '修改',
    editTitle: '修改模板',
    actions: '操作',
    delete: '删除',
    deleteConfirm: '确认删除选中的模板吗？',
    deleteSuccess: '删除成功',
    deleteError: '删除失败',
    deleteEmpty: '请先选择要删除的模板',
    deleteMissingId: '未找到需要删除的模板',
    enabled: '启用',
    disabled: '停用',
    fetchError: '获取模板列表失败',
    dimensionFetchError: '获取维度数据失败',
    saveSuccess: '保存成功',
    saveError: '保存失败',
    updateSuccess: '修改成功',
    updateError: '修改失败',
    editMissingId: '未找到需要修改的模板',
    interestType: '职业兴趣类型',
    interestTypePlaceholder: '请选择职业兴趣类型',
    abilityLevel: '能力水平',
    abilityLevelPlaceholder: '请选择能力水平',
    abilityLow: '低',
    abilityHigh: '高',
    valueType: '价值观类型',
    valueTypePlaceholder: '请选择价值观类型',
    personalityTrait: '人格特质类型',
    personalityTraitPlaceholder: '请选择人格特质类型',
    interestDesc: '职业兴趣描述',
    interestDescPlaceholder: '请输入职业兴趣描述',
    abilityDesc: '能力描述',
    abilityDescPlaceholder: '请输入能力描述',
    valueDesc: '价值观描述',
    valueDescPlaceholder: '请输入价值观描述',
    personalityDesc: '人格特质描述',
    personalityDescPlaceholder: '请输入人格特质描述',
    comprehensiveDesc: '综合描述',
    comprehensiveDescPlaceholder: '请输入综合描述（可选）',
    representative: '代表人物',
    representativePlaceholder: '请输入代表人物（可选）',
    confirm: '确定',
    cancel: '取消'
} as const

export const interestMap = {
    R: '现实型',
    I: '研究型',
    A: '艺术型',
    S: '社会型',
    E: '企业型',
    C: '常规型'
} as const

export const abilityMap = {
    1: '低水平',
    2: '高水平'
} as const

export const staticValueMap = {
    ACHIEVEMENT: '成就导向',
    INDEPENDENCE: '独立自主',
    RECOGNITION: '社会认可',
    SUPPORT: '注重支持',
    WORKING_CONDITIONS: '工作条件',
    RELATIONSHIPS: '人际关系'
} as const

export const staticPersonalityMap = {
    NEUROTICISM: '神经质',
    EXTRAVERSION: '外向性',
    OPENNESS: '开放性',
    AGREEABLENESS: '宜人性',
    CONSCIENTIOUSNESS: '尽责性'
} as const

export const VALUE_KEYWORDS = ['value', 'values', '价值', '价值观'] as const
export const PERSONALITY_KEYWORDS = ['personality', 'trait', '人格', '特质'] as const

