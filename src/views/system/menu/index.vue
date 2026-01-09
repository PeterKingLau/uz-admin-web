<template>
    <div class="app-container system-menu">
        <el-form v-show="showSearch" ref="queryRef" :model="queryParams" :inline="true" class="search-form">
            <el-form-item label="菜单名称" prop="menuName">
                <el-input v-model="queryParams.menuName" placeholder="请输入菜单名称" clearable class="search-input" @keyup.enter="handleQuery">
                    <template #prefix>
                        <Icon icon="mdi:magnify" />
                    </template>
                </el-input>
            </el-form-item>
            <el-form-item label="状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="菜单状态" clearable class="search-input">
                    <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleQuery"> <Icon icon="mdi:magnify" class="mr-1" /> 搜索 </el-button>
                <el-button @click="resetQuery"> <Icon icon="mdi:refresh" class="mr-1" /> 重置 </el-button>
            </el-form-item>
        </el-form>

        <div class="table-wrapper">
            <div class="table-header">
                <div class="left-tools">
                    <el-button type="primary" plain @click="handleAdd" v-hasPermi="['system:menu:add']"> <Icon icon="mdi:plus" class="mr-1" /> 新增 </el-button>
                    <el-button type="info" plain @click="toggleExpandAll"> <Icon icon="mdi:sort-variant" class="mr-1" /> 展开/折叠 </el-button>
                </div>
                <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
            </div>

            <el-table
                v-if="refreshTable"
                v-loading="loading"
                :data="menuList"
                row-key="menuId"
                :default-expand-all="isExpandAll"
                :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
                header-cell-class-name="table-header-cell"
            >
                <el-table-column prop="menuName" label="菜单名称" :show-overflow-tooltip="true" min-width="180">
                    <template #default="{ row }">
                        <span class="menu-name">{{ row.menuName }}</span>
                    </template>
                </el-table-column>

                <el-table-column prop="icon" label="图标" align="center" width="80">
                    <template #default="{ row }">
                        <div class="menu-icon-cell">
                            <Icon v-if="row.icon" :icon="row.icon" class="menu-icon" />
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="orderNum" label="排序" width="80" align="center" />

                <el-table-column prop="perms" label="权限标识" :show-overflow-tooltip="true" min-width="150">
                    <template #default="{ row }">
                        <span class="menu-perms">{{ row.perms || '-' }}</span>
                    </template>
                </el-table-column>

                <el-table-column prop="component" label="组件路径" :show-overflow-tooltip="true" min-width="180" />

                <el-table-column prop="status" label="状态" width="100" align="center">
                    <template #default="scope">
                        <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
                    </template>
                </el-table-column>

                <el-table-column label="创建时间" align="center" width="160" prop="createTime">
                    <template #default="scope">
                        <span class="time-cell">{{ parseTime(scope.row.createTime) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="操作" align="center" width="280" fixed="right">
                    <template #default="scope">
                        <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:menu:edit']">
                            <Icon icon="mdi:pencil" class="mr-1" /> 修改
                        </el-button>
                        <el-button link type="primary" @click="handleAdd(scope.row)" v-hasPermi="['system:menu:add']">
                            <Icon icon="mdi:plus" class="mr-1" /> 新增
                        </el-button>
                        <el-button link type="primary" @click="handleCopy(scope.row)" v-hasPermi="['system:menu:add']">
                            <Icon icon="mdi:content-copy" class="mr-1" /> 复制
                        </el-button>
                        <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermi="['system:menu:remove']">
                            <Icon icon="mdi:trash-can-outline" class="mr-1" /> 删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <el-dialog :title="title" v-model="open" width="720px" append-to-body @close="handleDialogClose" class="custom-dialog system-menu-dialog" top="5vh">
            <el-form ref="menuRef" :model="form" :rules="rules" label-width="100px" label-position="right">
                <div class="form-grid">
                    <el-row :gutter="24">
                        <el-col :span="24">
                            <el-form-item label="上级菜单">
                                <el-tree-select
                                    v-model="form.parentId"
                                    :data="menuOptions"
                                    :props="{ value: 'menuId', label: 'menuName', children: 'children' }"
                                    value-key="menuId"
                                    placeholder="选择上级菜单"
                                    check-strictly
                                    style="width: 100%"
                                />
                            </el-form-item>
                        </el-col>

                        <el-col :span="24">
                            <el-form-item label="菜单类型" prop="menuType">
                                <el-radio-group v-model="form.menuType">
                                    <el-radio-button value="M">目录</el-radio-button>
                                    <el-radio-button value="C">菜单</el-radio-button>
                                    <el-radio-button value="F">按钮</el-radio-button>
                                </el-radio-group>
                            </el-form-item>
                        </el-col>

                        <el-col :span="24" v-if="form.menuType != 'F'">
                            <el-form-item label="菜单图标" prop="icon">
                                <el-popover placement="bottom-start" :width="540" v-model:visible="iconPopoverVisible" trigger="click">
                                    <template #reference>
                                        <el-input v-model="form.icon" placeholder="点击选择图标" readonly class="cursor-pointer">
                                            <template #prefix>
                                                <Icon :icon="form.icon || 'mdi:magnify'" class="text-lg" />
                                            </template>
                                        </el-input>
                                    </template>
                                    <div class="icon-select-wrapper">
                                        <icon-select ref="iconSelectRef" :active-icon="form.icon" @selected="selected" />
                                    </div>
                                </el-popover>
                            </el-form-item>
                        </el-col>

                        <el-col :span="12">
                            <el-form-item label="菜单名称" prop="menuName">
                                <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
                            </el-form-item>
                        </el-col>

                        <el-col :span="12">
                            <el-form-item label="显示排序" prop="orderNum">
                                <el-input-number v-model="form.orderNum" controls-position="right" :min="0" style="width: 100%" />
                            </el-form-item>
                        </el-col>

                        <el-col :span="12" v-if="form.menuType != 'F'">
                            <el-form-item>
                                <template #label>
                                    <div class="form-item-label">
                                        <span>是否外链</span>
                                        <el-tooltip content="选择是外链则路由地址需要以`http(s)://`开头" placement="top">
                                            <Icon icon="mdi:help-circle-outline" class="help-icon" />
                                        </el-tooltip>
                                    </div>
                                </template>
                                <el-radio-group v-model="form.isFrame">
                                    <el-radio value="0">是</el-radio>
                                    <el-radio value="1">否</el-radio>
                                </el-radio-group>
                            </el-form-item>
                        </el-col>

                        <el-col :span="12" v-if="form.menuType != 'F'">
                            <el-form-item prop="path">
                                <template #label>
                                    <div class="form-item-label">
                                        <span>路由地址</span>
                                        <el-tooltip content="访问的路由地址，如：`user`，如外网地址需内链访问则以`http(s)://`开头" placement="top">
                                            <Icon icon="mdi:help-circle-outline" class="help-icon" />
                                        </el-tooltip>
                                    </div>
                                </template>
                                <el-input v-model="form.path" placeholder="请输入路由地址" />
                            </el-form-item>
                        </el-col>

                        <el-col :span="12" v-if="form.menuType == 'C'">
                            <el-form-item prop="component">
                                <template #label>
                                    <div class="form-item-label">
                                        <span>组件路径</span>
                                        <el-tooltip content="访问的组件路径，如：`system/user/index`，默认在`views`目录下" placement="top">
                                            <Icon icon="mdi:help-circle-outline" class="help-icon" />
                                        </el-tooltip>
                                    </div>
                                </template>
                                <el-input v-model="form.component" placeholder="请输入组件路径" />
                            </el-form-item>
                        </el-col>

                        <el-col :span="12" v-if="form.menuType != 'M'">
                            <el-form-item>
                                <template #label>
                                    <div class="form-item-label">
                                        <span>权限字符</span>
                                        <el-tooltip content="控制器中定义的权限字符，如：@PreAuthorize(`@ss.hasPermi('system:user:list')`)" placement="top">
                                            <Icon icon="mdi:help-circle-outline" class="help-icon" />
                                        </el-tooltip>
                                    </div>
                                </template>
                                <el-input v-model="form.perms" placeholder="请输入权限标识" maxlength="100" />
                            </el-form-item>
                        </el-col>

                        <el-col :span="12" v-if="form.menuType == 'C'">
                            <el-form-item>
                                <template #label>
                                    <div class="form-item-label">
                                        <span>路由参数</span>
                                        <el-tooltip content='访问路由的默认传递参数，如：{"id": 1, "name": "ry"}' placement="top">
                                            <Icon icon="mdi:help-circle-outline" class="help-icon" />
                                        </el-tooltip>
                                    </div>
                                </template>
                                <el-input v-model="form.query" placeholder="请输入路由参数" maxlength="255" />
                            </el-form-item>
                        </el-col>

                        <el-col :span="12" v-if="form.menuType == 'C'">
                            <el-form-item>
                                <template #label>
                                    <div class="form-item-label">
                                        <span>是否缓存</span>
                                        <el-tooltip content="选择是则会被`keep-alive`缓存，需要匹配组件的`name`和地址保持一致" placement="top">
                                            <Icon icon="mdi:help-circle-outline" class="help-icon" />
                                        </el-tooltip>
                                    </div>
                                </template>
                                <el-radio-group v-model="form.isCache">
                                    <el-radio value="0">缓存</el-radio>
                                    <el-radio value="1">不缓存</el-radio>
                                </el-radio-group>
                            </el-form-item>
                        </el-col>

                        <el-col :span="12" v-if="form.menuType != 'F'">
                            <el-form-item>
                                <template #label>
                                    <div class="form-item-label">
                                        <span>显示状态</span>
                                        <el-tooltip content="选择隐藏则路由将不会出现在侧边栏，但仍然可以访问" placement="top">
                                            <Icon icon="mdi:help-circle-outline" class="help-icon" />
                                        </el-tooltip>
                                    </div>
                                </template>
                                <el-radio-group v-model="form.visible">
                                    <el-radio v-for="dict in sys_show_hide" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
                                </el-radio-group>
                            </el-form-item>
                        </el-col>

                        <el-col :span="12">
                            <el-form-item>
                                <template #label>
                                    <div class="form-item-label">
                                        <span>菜单状态</span>
                                        <el-tooltip content="选择停用则路由将不会出现在侧边栏，也不能被访问" placement="top">
                                            <Icon icon="mdi:help-circle-outline" class="help-icon" />
                                        </el-tooltip>
                                    </div>
                                </template>
                                <el-radio-group v-model="form.status">
                                    <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
                                </el-radio-group>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </div>
            </el-form>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="cancel">取 消</el-button>
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="Menu">
import { getCurrentInstance, onMounted, nextTick, reactive, ref, toRefs, watch } from 'vue'
import { addMenu, delMenu, getMenu, listMenu, updateMenu } from '@/api/system/menu'
import IconSelect from '@/components/IconSelect'
import { parseTime } from '@/utils/ruoyi'

const { proxy } = getCurrentInstance()

const { sys_show_hide, sys_normal_disable } = proxy.useDict('sys_show_hide', 'sys_normal_disable')

const menuList = ref([])
const open = ref(false)
const loading = ref(false)
const showSearch = ref(true)
const title = ref('')
const menuOptions = ref([])
const isExpandAll = ref(false)
const refreshTable = ref(true)
const iconSelectRef = ref(null)
const iconPopoverVisible = ref(false)

const data = reactive({
    form: {},
    queryParams: {
        menuName: undefined,
        visible: undefined,
        status: undefined
    },
    rules: {
        menuName: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
        orderNum: [{ required: true, message: '菜单顺序不能为空', trigger: 'blur' }],
        path: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }]
    }
})

const { queryParams, form, rules } = toRefs(data)

watch(iconPopoverVisible, val => {
    if (val) {
        nextTick(() => {
            if (iconSelectRef.value) iconSelectRef.value.reset()
        })
    }
})

function getList() {
    loading.value = true
    listMenu(queryParams.value)
        .then(response => {
            menuList.value = proxy.handleTree(response.data, 'menuId')
        })
        .finally(() => {
            loading.value = false
        })
}

function getTreeselect() {
    menuOptions.value = []
    listMenu().then(response => {
        const menu = { menuId: 0, menuName: '主类目', children: [] }
        menu.children = proxy.handleTree(response.data, 'menuId')
        menuOptions.value.push(menu)
    })
}

function cancel() {
    open.value = false
    reset()
}

function reset() {
    form.value = {
        menuId: undefined,
        parentId: 0,
        menuName: undefined,
        icon: undefined,
        menuType: 'M',
        orderNum: undefined,
        isFrame: '1',
        isCache: '0',
        visible: '0',
        status: '0'
    }
    proxy.resetForm('menuRef')
}

function selected(name) {
    form.value.icon = name
    iconPopoverVisible.value = false
}

function handleQuery() {
    getList()
}

function handleDialogClose() {
    iconPopoverVisible.value = false
    nextTick(() => {
        if (iconSelectRef.value) iconSelectRef.value.reset()
    })
}

function resetQuery() {
    proxy.resetForm('queryRef')
    handleQuery()
}

function handleAdd(row) {
    reset()
    getTreeselect()
    if (row != null && row.menuId) {
        form.value.parentId = row.menuId
    } else {
        form.value.parentId = 0
    }
    open.value = true
    title.value = '添加菜单'
}

function toggleExpandAll() {
    refreshTable.value = false
    isExpandAll.value = !isExpandAll.value
    nextTick(() => {
        refreshTable.value = true
    })
}

function handleUpdate(row) {
    reset()
    getTreeselect()
    getMenu(row.menuId).then(response => {
        form.value = response.data
        open.value = true
        title.value = '修改菜单'
    })
}

function handleCopy(row) {
    reset()
    getTreeselect()
    getMenu(row.menuId).then(response => {
        const data = { ...response.data }
        data.menuId = undefined
        data.menuName = data.menuName ? `${data.menuName} - 副本` : data.menuName
        form.value = data
        open.value = true
        title.value = '复制菜单'
    })
}

function submitForm() {
    proxy.$refs['menuRef'].validate(valid => {
        if (!valid) return
        if (form.value.menuId != undefined) {
            updateMenu(form.value).then(() => {
                proxy.$modal.msgSuccess('修改成功')
                open.value = false
                getList()
            })
        } else {
            addMenu(form.value).then(() => {
                proxy.$modal.msgSuccess('新增成功')
                open.value = false
                getList()
            })
        }
    })
}

function handleDelete(row) {
    proxy.$modal
        .confirm('是否确认删除名称为"' + row.menuName + '"的数据项?')
        .then(() => delMenu(row.menuId))
        .then(() => {
            getList()
            proxy.$modal.msgSuccess('删除成功')
        })
        .catch(() => {})
}

onMounted(() => {
    getList()
})
</script>
