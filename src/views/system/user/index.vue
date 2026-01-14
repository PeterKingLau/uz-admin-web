<template>
    <div class="app-container system-user">
        <splitpanes :horizontal="appStore.device === 'mobile'" class="default-theme">
            <pane size="18" min-size="15" max-size="30">
                <div class="dept-wrapper">
                    <div class="head-container">
                        <el-input v-model="deptName" placeholder="请输入部门名称" clearable class="dept-search">
                            <template #prefix>
                                <Icon icon="ep:search" />
                            </template>
                        </el-input>
                    </div>

                    <div class="tree-container">
                        <el-tree
                            :data="deptOptions"
                            :props="{ label: 'label', children: 'children' }"
                            :expand-on-click-node="false"
                            :filter-node-method="filterNode"
                            ref="deptTreeRef"
                            node-key="id"
                            highlight-current
                            default-expand-all
                            @node-click="handleNodeClick"
                            class="depart-tree"
                        >
                            <template #default="{ node, data }">
                                <span class="custom-tree-node">
                                    <Icon
                                        class="tree-icon"
                                        :icon="
                                            node.level === 1 ? 'ep:school' : data.children && data.children.length > 0 ? 'mdi:account-supervisor' : 'ep:user'
                                        "
                                    />
                                    <span class="node-label" :title="node.label">{{ node.label }}</span>
                                </span>
                            </template>
                        </el-tree>
                    </div>
                </div>
            </pane>

            <pane size="84">
                <div class="user-pane">
                    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" class="search-form">
                        <el-form-item label="用户名称" prop="userName">
                            <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable class="search-input" @keyup.enter="handleQuery" />
                        </el-form-item>
                        <el-form-item label="手机号码" prop="phonenumber">
                            <el-input
                                v-model="queryParams.phonenumber"
                                placeholder="请输入手机号码"
                                clearable
                                class="search-input"
                                @keyup.enter="handleQuery"
                            />
                        </el-form-item>
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="queryParams.status" placeholder="用户状态" clearable class="search-input">
                                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="创建时间">
                            <el-date-picker
                                v-model="dateRange"
                                value-format="YYYY-MM-DD"
                                type="daterange"
                                range-separator="-"
                                start-placeholder="开始日期"
                                end-placeholder="结束日期"
                                class="date-range"
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="handleQuery"> <Icon icon="ep:search" class="mr-1" /> 搜索 </el-button>
                            <el-button @click="resetQuery"> <Icon icon="ep:refresh" class="mr-1" /> 重置 </el-button>
                        </el-form-item>
                    </el-form>

                    <div class="table-wrapper">
                        <div class="table-header">
                            <div class="left-tools">
                                <el-button type="primary" plain @click="handleAdd" v-hasPermi="['system:user:add']">
                                    <Icon icon="ep:plus" class="mr-1" /> 新增
                                </el-button>
                                <el-button type="success" plain :disabled="single" @click="handleUpdate" v-hasPermi="['system:user:edit']">
                                    <Icon icon="ep:edit" class="mr-1" /> 修改
                                </el-button>
                                <el-button type="danger" plain :disabled="multiple" @click="handleDelete" v-hasPermi="['system:user:remove']">
                                    <Icon icon="ep:delete" class="mr-1" /> 删除
                                </el-button>
                                <el-button type="info" plain @click="handleImport" v-hasPermi="['system:user:import']">
                                    <Icon icon="ep:upload" class="mr-1" /> 导入
                                </el-button>
                                <el-button type="warning" plain @click="handleExport" v-hasPermi="['system:user:export']">
                                    <Icon icon="ep:download" class="mr-1" /> 导出
                                </el-button>
                            </div>
                            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" :columns="columns" />
                        </div>

                        <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange" header-cell-class-name="table-header-cell">
                            <el-table-column type="selection" width="50" align="center" />
                            <el-table-column label="用户编号" align="center" key="userId" prop="userId" v-if="columns[0].visible" />
                            <el-table-column
                                label="用户名称"
                                align="center"
                                key="userName"
                                prop="userName"
                                v-if="columns[1].visible"
                                :show-overflow-tooltip="true"
                            />
                            <el-table-column
                                label="用户昵称"
                                align="center"
                                key="nickName"
                                prop="nickName"
                                v-if="columns[2].visible"
                                :show-overflow-tooltip="true"
                            />
                            <el-table-column
                                label="部门"
                                align="center"
                                key="deptName"
                                prop="dept.deptName"
                                v-if="columns[3].visible"
                                :show-overflow-tooltip="true"
                            />
                            <el-table-column label="手机号码" align="center" key="phonenumber" prop="phonenumber" v-if="columns[4].visible" width="120" />
                            <el-table-column label="状态" align="center" key="status" v-if="columns[5].visible">
                                <template #default="scope">
                                    <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)" />
                                </template>
                            </el-table-column>
                            <el-table-column label="创建时间" align="center" prop="createTime" v-if="columns[6].visible" width="160">
                                <template #default="scope">
                                    <span class="time-cell">{{ parseTime(scope.row.createTime) }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
                                <template #default="scope">
                                    <el-tooltip content="修改" placement="top" v-if="scope.row.userId !== 1">
                                        <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:user:edit']">
                                            <Icon icon="ep:edit" />
                                        </el-button>
                                    </el-tooltip>
                                    <el-tooltip content="删除" placement="top" v-if="scope.row.userId !== 1">
                                        <el-button link type="primary" @click="handleDelete(scope.row)" v-hasPermi="['system:user:remove']">
                                            <Icon icon="ep:delete" />
                                        </el-button>
                                    </el-tooltip>
                                    <el-tooltip content="重置密码" placement="top" v-if="scope.row.userId !== 1">
                                        <el-button link type="primary" @click="handleResetPwd(scope.row)" v-hasPermi="['system:user:resetPwd']">
                                            <Icon icon="ep:key" />
                                        </el-button>
                                    </el-tooltip>
                                    <el-tooltip content="分配角色" placement="top" v-if="scope.row.userId !== 1">
                                        <el-button link type="primary" @click="handleAuthRole(scope.row)" v-hasPermi="['system:user:edit']">
                                            <Icon icon="mdi:check-circle-outline" />
                                        </el-button>
                                    </el-tooltip>
                                </template>
                            </el-table-column>
                        </el-table>

                        <div class="pagination-container">
                            <pagination
                                v-show="total > 0"
                                :total="total"
                                v-model:page="queryParams.pageNum"
                                v-model:limit="queryParams.pageSize"
                                @pagination="getList"
                            />
                        </div>
                    </div>
                </div>
            </pane>
        </splitpanes>

        <el-dialog :title="title" v-model="open" width="600px" append-to-body class="system-user-dialog">
            <el-form :model="form" :rules="rules" ref="userRef" label-width="80px">
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="用户昵称" prop="nickName">
                            <el-input v-model="form.nickName" placeholder="请输入用户昵称" maxlength="30" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="归属部门" prop="deptId">
                            <el-tree-select
                                v-model="form.deptId"
                                :data="enabledDeptOptions"
                                :props="{ value: 'id', label: 'label', children: 'children' }"
                                value-key="id"
                                placeholder="请选择归属部门"
                                check-strictly
                            />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="手机号码" prop="phonenumber">
                            <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="邮箱" prop="email">
                            <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col :span="12">
                        <el-form-item v-if="form.userId == undefined" label="用户名称" prop="userName">
                            <el-input v-model="form.userName" placeholder="请输入用户名称" maxlength="30" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item v-if="form.userId == undefined" label="用户密码" prop="password">
                            <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="用户性别">
                            <el-select v-model="form.sex" placeholder="请选择">
                                <el-option v-for="dict in sys_user_sex" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="状态">
                            <el-radio-group v-model="form.status">
                                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="岗位">
                            <el-select v-model="form.postIds" multiple placeholder="请选择">
                                <el-option
                                    v-for="item in postOptions"
                                    :key="item.postId"
                                    :label="item.postName"
                                    :value="item.postId"
                                    :disabled="item.status == 1"
                                ></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="角色">
                            <el-select v-model="form.roleIds" multiple placeholder="请选择">
                                <el-option
                                    v-for="item in roleOptions"
                                    :key="item.roleId"
                                    :label="item.roleName"
                                    :value="item.roleId"
                                    :disabled="item.status == 1"
                                ></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col :span="24">
                        <el-form-item label="备注">
                            <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                    <el-button @click="cancel">取 消</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog :title="upload.title" v-model="upload.open" width="400px" append-to-body class="system-user-dialog">
            <el-upload
                ref="uploadRef"
                :limit="1"
                accept=".xlsx, .xls"
                :headers="upload.headers"
                :action="upload.url + '?updateSupport=' + upload.updateSupport"
                :disabled="upload.isUploading"
                :on-progress="handleFileUploadProgress"
                :on-success="handleFileSuccess"
                :auto-upload="false"
                drag
            >
                <Icon icon="ep:upload-filled" class="el-icon--upload" />
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                <template #tip>
                    <div class="el-upload__tip text-center">
                        <div class="el-upload__tip"><el-checkbox v-model="upload.updateSupport" />是否更新已经存在的用户数据</div>
                        <span>仅允许导入xls、xlsx格式文件。</span>
                        <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="importTemplate">下载模板</el-link>
                    </div>
                </template>
            </el-upload>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitFileForm">确 定</el-button>
                    <el-button @click="upload.open = false">取 消</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="User">
import { getToken } from '@/utils/auth'
import useAppStore from '@/store/modules/app'
import { changeUserStatus, listUser, resetUserPwd, delUser, getUser, updateUser, addUser, deptTreeSelect } from '@/api/system/user'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { useRouter } from 'vue-router'

const router = useRouter()
const appStore = useAppStore()
const { proxy } = getCurrentInstance()
const { sys_normal_disable, sys_user_sex } = proxy.useDict('sys_normal_disable', 'sys_user_sex')

const userList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const dateRange = ref([])
const deptName = ref('')
const deptOptions = ref(undefined)
const enabledDeptOptions = ref(undefined)
const initPassword = ref(undefined)
const postOptions = ref([])
const roleOptions = ref([])

const upload = reactive({
    open: false,
    title: '',
    isUploading: false,
    updateSupport: 0,
    headers: { Authorization: 'Bearer ' + getToken() },
    url: import.meta.env.VITE_APP_BASE_API + '/system/user/importData'
})

const columns = ref([
    { key: 0, label: `用户编号`, visible: true },
    { key: 1, label: `用户名称`, visible: true },
    { key: 2, label: `用户昵称`, visible: true },
    { key: 3, label: `部门`, visible: true },
    { key: 4, label: `手机号码`, visible: true },
    { key: 5, label: `状态`, visible: true },
    { key: 6, label: `创建时间`, visible: true }
])

const data = reactive({
    form: {},
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        userName: undefined,
        phonenumber: undefined,
        status: undefined,
        deptId: undefined
    },
    rules: {
        userName: [
            { required: true, message: '用户名称不能为空', trigger: 'blur' },
            {
                min: 2,
                max: 20,
                message: '用户名称长度必须介于 2 和 20 之间',
                trigger: 'blur'
            }
        ],
        nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
        password: [
            { required: true, message: '用户密码不能为空', trigger: 'blur' },
            {
                min: 5,
                max: 20,
                message: '用户密码长度必须介于 5 和 20 之间',
                trigger: 'blur'
            },
            {
                pattern: /^[^<>"'|\\]+$/,
                message: '不能包含非法字符：< > " \' \\\ |',
                trigger: 'blur'
            }
        ],
        email: [
            {
                type: 'email',
                message: '请输入正确的邮箱地址',
                trigger: ['blur', 'change']
            }
        ],
        phonenumber: [
            {
                pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
                message: '请输入正确的手机号码',
                trigger: 'blur'
            }
        ]
    }
})

const { queryParams, form, rules } = toRefs(data)

const filterNode = (value, data) => {
    if (!value) return true
    return data.label.indexOf(value) !== -1
}

watch(deptName, val => {
    proxy.$refs['deptTreeRef'].filter(val)
})

function getList() {
    loading.value = true
    listUser(proxy.addDateRange(queryParams.value, dateRange.value)).then(res => {
        loading.value = false
        userList.value = res.rows
        total.value = res.total
    })
}

function getDeptTree() {
    deptTreeSelect().then(response => {
        deptOptions.value = response.data
        enabledDeptOptions.value = filterDisabledDept(JSON.parse(JSON.stringify(response.data)))
    })
}

function filterDisabledDept(deptList) {
    return deptList.filter(dept => {
        if (dept.disabled) {
            return false
        }
        if (dept.children && dept.children.length) {
            dept.children = filterDisabledDept(dept.children)
        }
        return true
    })
}

function handleNodeClick(data) {
    queryParams.value.deptId = data.id
    handleQuery()
}

function handleQuery() {
    queryParams.value.pageNum = 1
    getList()
}

function resetQuery() {
    dateRange.value = []
    proxy.resetForm('queryRef')
    queryParams.value.deptId = undefined
    proxy.$refs.deptTreeRef.setCurrentKey(null)
    handleQuery()
}

function handleDelete(row) {
    const userIds = row.userId || ids.value
    proxy.$modal
        .confirm('是否确认删除用户编号为"' + userIds + '"的数据项？')
        .then(function () {
            return delUser(userIds)
        })
        .then(() => {
            getList()
            proxy.$modal.msgSuccess('删除成功')
        })
        .catch(() => {})
}

function handleExport() {
    proxy.download(
        'system/user/export',
        {
            ...queryParams.value
        },
        `user_${new Date().getTime()}.xlsx`
    )
}

function handleStatusChange(row) {
    let text = row.status === '0' ? '启用' : '停用'
    proxy.$modal
        .confirm('确认要"' + text + '""' + row.userName + '"用户吗?')
        .then(function () {
            return changeUserStatus(row.userId, row.status)
        })
        .then(() => {
            proxy.$modal.msgSuccess(text + '成功')
        })
        .catch(function () {
            row.status = row.status === '0' ? '1' : '0'
        })
}

function handleCommand(command, row) {
    switch (command) {
        case 'handleResetPwd':
            handleResetPwd(row)
            break
        case 'handleAuthRole':
            handleAuthRole(row)
            break
        default:
            break
    }
}

function handleAuthRole(row) {
    const userId = row.userId
    router.push('/system/user-auth/role/' + userId)
}

function handleResetPwd(row) {
    proxy
        .$prompt('请输入"' + row.userName + '"的新密码', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            closeOnClickModal: false,
            inputPattern: /^.{5,20}$/,
            inputErrorMessage: '用户密码长度必须介于 5 和 20 之间',
            inputValidator: value => {
                if (/<|>|"|'|\||\\/.test(value)) {
                    return '不能包含非法字符：< > " \' \\\ |'
                }
            }
        })
        .then(({ value }) => {
            resetUserPwd(row.userId, value).then(response => {
                proxy.$modal.msgSuccess('修改成功，新密码是：' + value)
            })
        })
        .catch(() => {})
}

function handleSelectionChange(selection) {
    ids.value = selection.map(item => item.userId)
    single.value = selection.length != 1
    multiple.value = !selection.length
}

function handleImport() {
    upload.title = '用户导入'
    upload.open = true
}

function importTemplate() {
    proxy.download('system/user/importTemplate', {}, `user_template_${new Date().getTime()}.xlsx`)
}

const handleFileUploadProgress = (event, file, fileList) => {
    upload.isUploading = true
}

const handleFileSuccess = (response, file, fileList) => {
    upload.open = false
    upload.isUploading = false
    proxy.$refs['uploadRef'].handleRemove(file)
    proxy.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + '</div>', '导入结果', {
        dangerouslyUseHTMLString: true
    })
    getList()
}

function submitFileForm() {
    proxy.$refs['uploadRef'].submit()
}

function reset() {
    form.value = {
        userId: undefined,
        deptId: undefined,
        userName: undefined,
        nickName: undefined,
        password: undefined,
        phonenumber: undefined,
        email: undefined,
        sex: undefined,
        status: '0',
        remark: undefined,
        postIds: [],
        roleIds: []
    }
    proxy.resetForm('userRef')
}

function cancel() {
    open.value = false
    reset()
}

function handleAdd() {
    reset()
    getUser().then(response => {
        postOptions.value = response.posts
        roleOptions.value = response.roles
        open.value = true
        title.value = '添加用户'
        form.value.password = initPassword.value
    })
}

function handleUpdate(row) {
    reset()
    const userId = row.userId || ids.value
    getUser(userId).then(response => {
        form.value = response.data
        postOptions.value = response.posts
        roleOptions.value = response.roles
        form.value.postIds = response.postIds
        form.value.roleIds = response.roleIds
        open.value = true
        title.value = '修改用户'
        form.password = ''
    })
}

function submitForm() {
    proxy.$refs['userRef'].validate(valid => {
        if (valid) {
            if (form.value.userId != undefined) {
                updateUser(form.value).then(response => {
                    proxy.$modal.msgSuccess('修改成功')
                    open.value = false
                    getList()
                })
            } else {
                addUser(form.value).then(response => {
                    proxy.$modal.msgSuccess('新增成功')
                    open.value = false
                    getList()
                })
            }
        }
    })
}

onMounted(() => {
    getDeptTree()
    getList()
    proxy.getConfigKey('sys.user.initPassword').then(response => {
        initPassword.value = response.msg
    })
})
</script>

<style scoped lang="scss">
.system-user {
    .table-wrapper {
        border-radius: 6px;

        .table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;

            .left-tools {
                display: flex;
                gap: 12px;
                align-items: center;
            }
        }
    }

    .time-cell {
        color: var(--el-text-color-secondary);
        font-size: 13px;
    }

    .row-title {
        font-weight: 500;
        color: var(--el-text-color-primary);
        cursor: pointer;
    }

    .row-code {
        font-family: 'JetBrains Mono', Consolas, monospace;
        color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
        border: 1px solid var(--el-color-primary-light-8);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
    }

    .user-pane {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-left: 20px;
    }

    .search-input {
        width: 240px;
    }

    .date-range {
        width: 320px;
    }

    .dept-wrapper {
        height: 100%;
        padding: 20px;
        background: var(--el-bg-color-overlay, #fff);
        border-right: 1px solid var(--el-border-color-light, #f0f0f0);
        display: flex;
        flex-direction: column;
    }

    .dept-search {
        margin-bottom: 20px;
    }

    .tree-container {
        flex: 1;
        overflow-y: auto;
        margin-top: 5px;

        &::-webkit-scrollbar {
            width: 4px;
        }
        &::-webkit-scrollbar-thumb {
            background: var(--el-border-color, #e0e5eb);
            border-radius: 4px;
        }
        &::-webkit-scrollbar-track {
            background: transparent;
        }
    }

    .depart-tree {
        background: transparent;
        color: var(--el-text-color-regular, #606266);
        font-size: 14px;

        .el-tree-node__content {
            height: 36px;
            border-radius: 4px;
            margin-bottom: 4px;
            transition: all 0.2s;

            &:hover {
                background-color: var(--el-fill-color-light, #f5f7fa);
            }
        }

        .el-tree-node.is-current > .el-tree-node__content {
            background-color: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
            font-weight: 500;

            .tree-icon {
                color: var(--el-color-primary);
            }
        }
    }

    .custom-tree-node {
        display: flex;
        align-items: center;
        width: 100%;
        overflow: hidden;

        .tree-icon {
            margin-right: 6px;
            font-size: 15px;
            color: var(--el-text-color-regular, #999);
        }

        .node-label {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

:deep(.system-user-dialog) {
    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
    }
}
</style>
