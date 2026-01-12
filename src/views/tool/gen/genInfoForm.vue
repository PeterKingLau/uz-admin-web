<template>
    <el-form ref="genInfoForm" :model="info" :rules="rules" label-width="150px">
        <el-row :gutter="20">
            <el-col :span="12">
                <el-form-item prop="tplCategory">
                    <template #label>生成模板</template>
                    <el-select v-model="info.tplCategory" @change="tplSelectChange" style="width: 100%">
                        <el-option label="单表（增删改查）" value="crud" />
                        <el-option label="树表（增删改查）" value="tree" />
                        <el-option label="主子表（增删改查）" value="sub" />
                    </el-select>
                </el-form-item>
            </el-col>

            <el-col :span="12">
                <el-form-item prop="tplWebType">
                    <template #label>前端类型</template>
                    <el-select v-model="info.tplWebType" style="width: 100%">
                        <el-option label="Vue2 Element UI 模版" value="element-ui" />
                        <el-option label="Vue3 Element Plus 模版" value="element-plus" />
                    </el-select>
                </el-form-item>
            </el-col>

            <el-col :span="12">
                <el-form-item prop="packageName">
                    <template #label>
                        <div class="label-item">
                            <span>生成包路径</span>
                            <el-tooltip content="生成在哪个java包下，例如 com.ruoyi.system" placement="top">
                                <Icon icon="ep:question-filled" class="label-icon" />
                            </el-tooltip>
                        </div>
                    </template>
                    <el-input v-model="info.packageName" />
                </el-form-item>
            </el-col>

            <el-col :span="12">
                <el-form-item prop="moduleName">
                    <template #label>
                        <div class="label-item">
                            <span>生成模块名</span>
                            <el-tooltip content="可理解为子系统名，例如 system" placement="top">
                                <Icon icon="ep:question-filled" class="label-icon" />
                            </el-tooltip>
                        </div>
                    </template>
                    <el-input v-model="info.moduleName" />
                </el-form-item>
            </el-col>

            <el-col :span="12">
                <el-form-item prop="businessName">
                    <template #label>
                        <div class="label-item">
                            <span>生成业务名</span>
                            <el-tooltip content="可理解为功能英文名，例如 user" placement="top">
                                <Icon icon="ep:question-filled" class="label-icon" />
                            </el-tooltip>
                        </div>
                    </template>
                    <el-input v-model="info.businessName" />
                </el-form-item>
            </el-col>

            <el-col :span="12">
                <el-form-item prop="functionName">
                    <template #label>
                        <div class="label-item">
                            <span>生成功能名</span>
                            <el-tooltip content="用作类描述，例如 用户" placement="top">
                                <Icon icon="ep:question-filled" class="label-icon" />
                            </el-tooltip>
                        </div>
                    </template>
                    <el-input v-model="info.functionName" />
                </el-form-item>
            </el-col>

            <el-col :span="12">
                <el-form-item prop="genType">
                    <template #label>
                        <div class="label-item">
                            <span>生成代码方式</span>
                            <el-tooltip content="默认为zip压缩包下载，也可以自定义生成路径" placement="top">
                                <Icon icon="ep:question-filled" class="label-icon" />
                            </el-tooltip>
                        </div>
                    </template>
                    <el-radio v-model="info.genType" value="0">zip压缩包</el-radio>
                    <el-radio v-model="info.genType" value="1">自定义路径</el-radio>
                </el-form-item>
            </el-col>

            <el-col :span="12">
                <el-form-item>
                    <template #label>
                        <div class="label-item">
                            <span>上级菜单</span>
                            <el-tooltip content="分配到指定菜单下，例如 系统管理" placement="top">
                                <Icon icon="ep:question-filled" class="label-icon" />
                            </el-tooltip>
                        </div>
                    </template>
                    <el-tree-select
                        v-model="info.parentMenuId"
                        :data="menuOptions"
                        :props="{ value: 'menuId', label: 'menuName', children: 'children' }"
                        value-key="menuId"
                        placeholder="请选择系统菜单"
                        check-strictly
                        style="width: 100%"
                    />
                </el-form-item>
            </el-col>

            <el-col :span="24" v-if="info.genType == '1'">
                <el-form-item prop="genPath">
                    <template #label>
                        <div class="label-item">
                            <span>自定义路径</span>
                            <el-tooltip content="填写磁盘绝对路径，若不填写，则生成到当前Web项目下" placement="top">
                                <Icon icon="ep:question-filled" class="label-icon" />
                            </el-tooltip>
                        </div>
                    </template>
                    <el-input v-model="info.genPath">
                        <template #append>
                            <el-dropdown>
                                <el-button type="primary">
                                    最近路径快速选择
                                    <Icon icon="ep:arrow-down" class="el-icon--right" />
                                </el-button>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item @click="info.genPath = '/'">恢复默认的生成基础路径</el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </template>
                    </el-input>
                </el-form-item>
            </el-col>
        </el-row>

        <template v-if="info.tplCategory == 'tree'">
            <h4 class="form-header">其他信息</h4>
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item>
                        <template #label>
                            <div class="label-item">
                                <span>树编码字段</span>
                                <el-tooltip content="树显示的编码字段名， 如：dept_id" placement="top">
                                    <Icon icon="ep:question-filled" class="label-icon" />
                                </el-tooltip>
                            </div>
                        </template>
                        <el-select v-model="info.treeCode" placeholder="请选择" style="width: 100%">
                            <el-option
                                v-for="(column, index) in info.columns"
                                :key="index"
                                :label="column.columnName + '：' + column.columnComment"
                                :value="column.columnName"
                            ></el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item>
                        <template #label>
                            <div class="label-item">
                                <span>树父编码字段</span>
                                <el-tooltip content="树显示的父编码字段名， 如：parent_Id" placement="top">
                                    <Icon icon="ep:question-filled" class="label-icon" />
                                </el-tooltip>
                            </div>
                        </template>
                        <el-select v-model="info.treeParentCode" placeholder="请选择" style="width: 100%">
                            <el-option
                                v-for="(column, index) in info.columns"
                                :key="index"
                                :label="column.columnName + '：' + column.columnComment"
                                :value="column.columnName"
                            ></el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item>
                        <template #label>
                            <div class="label-item">
                                <span>树名称字段</span>
                                <el-tooltip content="树节点的显示名称字段名， 如：dept_name" placement="top">
                                    <Icon icon="ep:question-filled" class="label-icon" />
                                </el-tooltip>
                            </div>
                        </template>
                        <el-select v-model="info.treeName" placeholder="请选择" style="width: 100%">
                            <el-option
                                v-for="(column, index) in info.columns"
                                :key="index"
                                :label="column.columnName + '：' + column.columnComment"
                                :value="column.columnName"
                            ></el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>
        </template>

        <template v-if="info.tplCategory == 'sub'">
            <h4 class="form-header">关联信息</h4>
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item>
                        <template #label>
                            <div class="label-item">
                                <span>关联子表的表名</span>
                                <el-tooltip content="关联子表的表名， 如：sys_user" placement="top">
                                    <Icon icon="ep:question-filled" class="label-icon" />
                                </el-tooltip>
                            </div>
                        </template>
                        <el-select v-model="info.subTableName" placeholder="请选择" @change="subSelectChange" style="width: 100%">
                            <el-option
                                v-for="(table, index) in tables"
                                :key="index"
                                :label="table.tableName + '：' + table.tableComment"
                                :value="table.tableName"
                            ></el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item>
                        <template #label>
                            <div class="label-item">
                                <span>子表关联的外键名</span>
                                <el-tooltip content="子表关联的外键名， 如：user_id" placement="top">
                                    <Icon icon="ep:question-filled" class="label-icon" />
                                </el-tooltip>
                            </div>
                        </template>
                        <el-select v-model="info.subTableFkName" placeholder="请选择" style="width: 100%">
                            <el-option
                                v-for="(column, index) in subColumns"
                                :key="index"
                                :label="column.columnName + '：' + column.columnComment"
                                :value="column.columnName"
                            ></el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>
        </template>
    </el-form>
</template>

<script setup>
import { listMenu } from '@/api/system/menu'
import { ref, watch, onMounted, getCurrentInstance } from 'vue'

const subColumns = ref([])
const menuOptions = ref([])
const { proxy } = getCurrentInstance()

const props = defineProps({
    info: {
        type: Object,
        default: null
    },
    tables: {
        type: Array,
        default: null
    }
})

const rules = ref({
    tplCategory: [{ required: true, message: '请选择生成模板', trigger: 'blur' }],
    packageName: [{ required: true, message: '请输入生成包路径', trigger: 'blur' }],
    moduleName: [{ required: true, message: '请输入生成模块名', trigger: 'blur' }],
    businessName: [{ required: true, message: '请输入生成业务名', trigger: 'blur' }],
    functionName: [{ required: true, message: '请输入生成功能名', trigger: 'blur' }]
})

function subSelectChange(value) {
    props.info.subTableFkName = ''
}

function tplSelectChange(value) {
    if (value !== 'sub') {
        props.info.subTableName = ''
        props.info.subTableFkName = ''
    }
}

function setSubTableColumns(value) {
    for (var item in props.tables) {
        const name = props.tables[item].tableName
        if (value === name) {
            subColumns.value = props.tables[item].columns
            break
        }
    }
}

function getMenuTreeselect() {
    listMenu().then(response => {
        menuOptions.value = proxy.handleTree(response.data, 'menuId')
    })
}

onMounted(() => {
    getMenuTreeselect()
})

watch(
    () => props.info.subTableName,
    val => {
        setSubTableColumns(val)
    }
)

watch(
    () => props.info.tplWebType,
    val => {
        if (val === '') {
            props.info.tplWebType = 'element-plus'
        }
    }
)

defineExpose({
    genInfoForm: proxy?.$refs.genInfoForm
})
</script>

<style lang="scss" scoped>
.form-header {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    padding: 0 0 10px 0;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--el-border-color-light);
}

.label-item {
    display: inline-flex;
    align-items: center;
    height: 32px;
}

.label-icon {
    margin-left: 4px;
    color: #909399;
    cursor: pointer;
    font-size: 14px;
}
</style>
