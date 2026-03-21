<template>
    <div class="app-container system-user">
        <splitpanes :horizontal="appStore.device === 'mobile'" class="modern-splitpanes">
            <pane size="18" min-size="15" max-size="30">
                <div class="dept-wrapper">
                    <div class="head-container">
                        <el-input v-model="deptName" placeholder="搜索部门" clearable class="dept-search custom-input">
                            <template #prefix>
                                <Icon icon="ep:search" class="search-icon" />
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
                    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" class="search-form modern-form">
                        <el-form-item label="用户名称" prop="userName">
                            <el-input
                                v-model="queryParams.userName"
                                placeholder="请输入用户名称"
                                clearable
                                class="search-input custom-input"
                                @keyup.enter="handleQuery"
                            />
                        </el-form-item>
                        <el-form-item label="手机号码" prop="phonenumber">
                            <el-input
                                v-model="queryParams.phonenumber"
                                placeholder="请输入手机号码"
                                clearable
                                class="search-input custom-input"
                                @keyup.enter="handleQuery"
                            />
                        </el-form-item>
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="queryParams.status" placeholder="用户状态" clearable class="search-input custom-select">
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
                                class="date-range custom-date-picker"
                            />
                        </el-form-item>
                        <el-form-item class="form-actions">
                            <el-button type="primary" @click="handleQuery" class="action-btn"> <Icon icon="ep:search" class="btn-icon" /> 搜索 </el-button>
                            <el-button @click="resetQuery" class="action-btn"> <Icon icon="ep:refresh" class="btn-icon" /> 重置 </el-button>
                        </el-form-item>
                    </el-form>

                    <div class="table-wrapper">
                        <div class="table-header">
                            <div class="left-tools">
                                <el-button type="primary" @click="handleAdd" v-hasPermi="['system:user:add']" class="tool-btn">
                                    <Icon icon="ep:plus" class="btn-icon" /> 新增
                                </el-button>
                                <el-button type="success" :disabled="single" @click="handleUpdate" v-hasPermi="['system:user:edit']" class="tool-btn">
                                    <Icon icon="ep:edit" class="btn-icon" /> 修改
                                </el-button>
                                <el-button type="danger" :disabled="multiple" @click="handleDelete" v-hasPermi="['system:user:remove']" class="tool-btn">
                                    <Icon icon="ep:delete" class="btn-icon" /> 删除
                                </el-button>
                                <el-button type="info" @click="handleImport" v-hasPermi="['system:user:import']" class="tool-btn">
                                    <Icon icon="ep:upload" class="btn-icon" /> 导入
                                </el-button>
                                <el-button type="warning" @click="handleExport" v-hasPermi="['system:user:export']" class="tool-btn">
                                    <Icon icon="ep:download" class="btn-icon" /> 导出
                                </el-button>
                            </div>
                            <div class="right-tools">
                                <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" :columns="columns" />
                            </div>
                        </div>

                        <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange" class="modern-table">
                            <el-table-column type="selection" width="50" align="center" />
                            <el-table-column label="编号" align="center" key="userId" prop="userId" v-if="columns[0].visible" width="80">
                                <template #default="scope">
                                    <span class="row-code">{{ scope.row.userId }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                label="用户名称"
                                align="center"
                                key="userName"
                                prop="userName"
                                v-if="columns[1].visible"
                                :show-overflow-tooltip="true"
                            >
                                <template #default="scope">
                                    <span class="row-title">{{ scope.row.userName }}</span>
                                </template>
                            </el-table-column>
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
                            >
                                <template #default="scope">
                                    <el-tag size="small" type="info" effect="light" class="dept-tag">
                                        {{ scope.row.dept?.deptName || '-' }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="手机号码" align="center" key="phonenumber" prop="phonenumber" v-if="columns[4].visible" width="130" />
                            <el-table-column label="状态" align="center" key="status" v-if="columns[5].visible" width="90">
                                <template #default="scope">
                                    <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)" />
                                </template>
                            </el-table-column>
                            <el-table-column label="创建时间" align="center" prop="createTime" v-if="columns[6].visible" width="160">
                                <template #default="scope">
                                    <span class="time-cell">{{ parseTime(scope.row.createTime) }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" align="center" width="160" fixed="right">
                                <template #default="scope">
                                    <div class="action-group">
                                        <el-tooltip content="修改" placement="top" v-if="scope.row.userId !== 1">
                                            <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:user:edit']" class="op-btn">
                                                <Icon icon="ep:edit" />
                                            </el-button>
                                        </el-tooltip>
                                        <el-tooltip content="删除" placement="top" v-if="scope.row.userId !== 1">
                                            <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermi="['system:user:remove']" class="op-btn">
                                                <Icon icon="ep:delete" />
                                            </el-button>
                                        </el-tooltip>
                                        <el-tooltip content="重置密码" placement="top" v-if="scope.row.userId !== 1">
                                            <el-button
                                                link
                                                type="warning"
                                                @click="handleResetPwd(scope.row)"
                                                v-hasPermi="['system:user:resetPwd']"
                                                class="op-btn"
                                            >
                                                <Icon icon="ep:key" />
                                            </el-button>
                                        </el-tooltip>
                                        <el-tooltip content="分配角色" placement="top" v-if="scope.row.userId !== 1">
                                            <el-button link type="success" @click="handleAuthRole(scope.row)" v-hasPermi="['system:user:edit']" class="op-btn">
                                                <Icon icon="ep:user" />
                                            </el-button>
                                        </el-tooltip>
                                    </div>
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

        <el-dialog :title="title" v-model="open" width="650px" append-to-body class="modern-dialog">
            <el-form :model="form" :rules="rules" ref="userRef" label-width="90px" class="modern-form">
                <el-row :gutter="24">
                    <el-col :span="12">
                        <el-form-item label="用户昵称" prop="nickName">
                            <el-input v-model="form.nickName" placeholder="请输入用户昵称" maxlength="30" class="custom-input" />
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
                                class="custom-select w-full"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="24">
                    <el-col :span="12">
                        <el-form-item label="手机号码" prop="phonenumber">
                            <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" class="custom-input" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="邮箱" prop="email">
                            <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" class="custom-input" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="24" v-if="form.userId == undefined">
                    <el-col :span="12">
                        <el-form-item label="用户名称" prop="userName">
                            <el-input v-model="form.userName" placeholder="请输入用户名称" maxlength="30" class="custom-input" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="用户密码" prop="password">
                            <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password class="custom-input" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="24">
                    <el-col :span="12">
                        <el-form-item label="用户性别">
                            <el-select v-model="form.sex" placeholder="请选择" class="custom-select w-full">
                                <el-option v-for="dict in sys_user_sex" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="状态">
                            <el-radio-group v-model="form.status" class="custom-radio">
                                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value" border>{{ dict.label }}</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="24">
                    <el-col :span="12">
                        <el-form-item label="岗位">
                            <el-select v-model="form.postIds" multiple placeholder="请选择岗位" class="custom-select w-full">
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
                            <el-select v-model="form.roleIds" multiple placeholder="请选择角色" class="custom-select w-full">
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
                            <el-input v-model="form.remark" type="textarea" placeholder="请输入备注信息" :rows="3" class="custom-textarea"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="cancel" class="dialog-btn">取 消</el-button>
                    <el-button type="primary" @click="submitForm" class="dialog-btn">确 定</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog :title="upload.title" v-model="upload.open" width="440px" append-to-body class="modern-dialog">
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
                class="modern-upload"
            >
                <Icon icon="ep:upload-filled" class="el-icon--upload upload-icon" />
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                <template #tip>
                    <div class="el-upload__tip text-center upload-tip">
                        <div class="checkbox-wrapper">
                            <el-checkbox v-model="upload.updateSupport" label="是否更新已经存在的用户数据" />
                        </div>
                        <div class="format-tip">仅允许导入xls、xlsx格式文件。</div>
                        <el-link type="primary" underline="never" class="download-link" @click="importTemplate">下载模板</el-link>
                    </div>
                </template>
            </el-upload>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="upload.open = false" class="dialog-btn">取 消</el-button>
                    <el-button type="primary" @click="submitFileForm" class="dialog-btn">确 定</el-button>
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
import { ref, reactive, toRefs, watch, onMounted, getCurrentInstance } from 'vue'

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
    height: calc(100vh - 84px);
    padding: 20px;
    background-color: var(--el-bg-color-page);
    box-sizing: border-box;

    .modern-splitpanes {
        height: 100%;

        :deep(.splitpanes__splitter) {
            background-color: transparent;
            box-sizing: border-box;
            position: relative;
            flex-shrink: 0;
            width: 16px;

            &::before {
                content: '';
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 4px;
                height: 30px;
                border-radius: 2px;
                background-color: var(--el-border-color-light);
                transition: background-color 0.3s;
                z-index: 10;
            }

            &:hover::before {
                background-color: var(--el-color-primary-light-3);
            }
        }

        :deep(.splitpanes__pane) {
            background-color: var(--el-bg-color);
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
            border: 1px solid var(--el-border-color-lighter);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
    }

    .dept-wrapper {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: transparent;
        padding: 0;

        .head-container {
            padding: 20px 20px 10px;

            .dept-search {
                margin: 0;
            }
        }

        .tree-container {
            flex: 1;
            overflow-y: auto;
            padding: 0 12px 20px;

            &::-webkit-scrollbar {
                width: 4px;
            }

            &::-webkit-scrollbar-thumb {
                background-color: var(--el-border-color-lighter);
                border-radius: 4px;
            }
        }
    }

    .depart-tree {
        background: transparent;
        color: var(--el-text-color-regular);
        font-size: 14px;

        :deep(.el-tree-node__content) {
            height: 38px;
            border-radius: 8px;
            margin-bottom: 4px;
            padding-right: 8px;
            transition: all 0.2s ease;

            &:hover {
                background-color: var(--el-fill-color-light);
            }
        }

        :deep(.el-tree-node.is-current > .el-tree-node__content) {
            background-color: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
            font-weight: 600;

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
            margin-right: 8px;
            font-size: 16px;
            color: var(--el-text-color-secondary);
            transition: color 0.2s;
        }

        .node-label {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .user-pane {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 20px;
        box-sizing: border-box;
        overflow: hidden;
    }

    .modern-form {
        margin-bottom: 20px;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;

        :deep(.el-form-item) {
            margin-bottom: 0;
            margin-right: 0;
        }

        :deep(.el-form-item__label) {
            font-weight: 600;
        }

        .search-input {
            width: 220px;
        }

        .date-range {
            width: 280px;
        }

        .form-actions {
            margin-left: auto;
        }
    }

    .custom-input,
    .custom-select,
    .custom-date-picker {
        :deep(.el-input__wrapper) {
            border-radius: 8px;
            box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
            background-color: var(--el-fill-color-blank);
            transition: all 0.2s;

            &:hover {
                box-shadow: 0 0 0 1px var(--el-border-color) inset;
            }

            &.is-focus,
            &.is-focused {
                box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
                background-color: var(--el-color-primary-light-9);
            }
        }
    }

    .action-btn,
    .tool-btn {
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.2s;

        &:hover {
            transform: translateY(-1px);
        }

        &.is-disabled,
        &:disabled {
            opacity: 0.55;
            cursor: not-allowed;
            box-shadow: none !important;
            transform: none !important;
        }

        &.is-disabled:hover,
        &:disabled:hover {
            transform: none;
        }
    }

    :deep(.action-btn > span),
    :deep(.tool-btn > span),
    :deep(.dialog-btn > span) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }

    .btn-icon {
        font-size: 16px;
        line-height: 1;
        flex-shrink: 0;
    }

    .action-btn.el-button--primary {
        box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
    }

    .table-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 12px;
        background-color: var(--el-bg-color);
        overflow: hidden;

        .table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            background-color: var(--el-fill-color-light);
            border-bottom: 1px solid var(--el-border-color-lighter);

            .left-tools {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
        }
    }

    .modern-table {
        width: 100%;
        height: 100%;

        :deep(.el-scrollbar__bar) {
            display: none !important;
        }

        :deep(.el-table__body-wrapper),
        :deep(.el-table__header-wrapper),
        :deep(.el-scrollbar__wrap) {
            scrollbar-width: none;
            -ms-overflow-style: none;

            &::-webkit-scrollbar {
                width: 0;
                height: 0;
                display: none;
            }
        }

        :deep(th.el-table__cell) {
            background-color: var(--el-fill-color-light);
            color: var(--el-text-color-primary);
            font-weight: 600;
            height: 48px;
        }

        .row-code {
            font-family: 'JetBrains Mono', Consolas, monospace;
            color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
        }

        .row-title {
            font-weight: 600;
            color: var(--el-text-color-primary);
        }

        .dept-tag {
            border: none;
            background-color: var(--el-fill-color-dark);
            color: var(--el-text-color-regular);
        }

        .time-cell {
            color: var(--el-text-color-secondary);
            font-size: 13px;
        }

        .action-group {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 4px;

            .op-btn {
                padding: 4px;
                height: 28px;
                width: 28px;
                border-radius: 6px;

                &:hover {
                    background-color: var(--el-fill-color-light);
                }

                :deep(svg) {
                    font-size: 16px;
                }
            }
        }
    }

    .pagination-container {
        padding: 16px;
        border-top: 1px solid var(--el-border-color-lighter);
        display: flex;
        justify-content: flex-end;
    }
}

.modern-dialog {
    :deep(.el-dialog__header) {
        padding: 20px 24px 16px;
        margin-right: 0;
        border-bottom: 1px solid var(--el-border-color-lighter);

        .el-dialog__title {
            font-size: 16px;
            font-weight: 600;
        }
    }

    :deep(.el-dialog__body) {
        padding: 24px;
    }

    :deep(.el-dialog__footer) {
        padding: 16px 24px;
        border-top: 1px solid var(--el-border-color-lighter);
    }

    .modern-form {
        :deep(.el-form-item__label) {
            font-weight: 500;
            color: var(--el-text-color-regular);
        }

        .w-full {
            width: 100%;
        }

        .custom-input,
        .custom-select {
            :deep(.el-input__wrapper) {
                border-radius: 8px;
                box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
                background-color: var(--el-fill-color-blank);

                &:hover {
                    box-shadow: 0 0 0 1px var(--el-border-color) inset;
                }

                &.is-focus,
                &.is-focused {
                    box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
                    background-color: var(--el-color-primary-light-9);
                }
            }
        }

        .custom-textarea {
            :deep(.el-textarea__inner) {
                border-radius: 8px;
                padding: 10px 14px;
                box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
                background-color: var(--el-fill-color-blank);

                &:hover {
                    box-shadow: 0 0 0 1px var(--el-border-color) inset;
                }

                &:focus {
                    box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
                    background-color: var(--el-color-primary-light-9);
                }
            }
        }

        .custom-radio {
            :deep(.el-radio.is-bordered) {
                border-radius: 8px;

                &.is-checked {
                    background-color: var(--el-color-primary-light-9);
                }
            }
        }
    }

    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;

        .dialog-btn {
            border-radius: 8px;
            padding: 8px 24px;
            font-weight: 500;
        }
    }

    .modern-upload {
        width: 100%;

        :deep(.el-upload) {
            width: 100%;
        }

        :deep(.el-upload-dragger) {
            width: 100%;
            border-radius: 12px;
            background-color: var(--el-fill-color-light);
            border: 1px dashed var(--el-border-color);
            padding: 40px 0;
            transition: all 0.3s;
            overflow: hidden;

            &:hover {
                background-color: var(--el-color-primary-light-9);
                border-color: var(--el-color-primary);
            }
        }

        :deep(.el-upload.is-drag) {
            width: 100%;
        }

        :deep(.el-upload__text) {
            font-size: 14px;
            line-height: 1.7;
            color: var(--el-text-color-regular);

            em {
                color: var(--el-color-primary);
                font-style: normal;
                font-weight: 600;
            }
        }

        .upload-icon {
            font-size: 48px;
            color: var(--el-color-primary-light-3);
            margin-bottom: 16px;
        }

        .upload-tip {
            margin-top: 16px;
            padding: 14px 16px 8px;
            border-radius: 10px;
            background-color: var(--el-fill-color-light);
            border: 1px solid var(--el-border-color-lighter);

            .checkbox-wrapper {
                display: flex;
                justify-content: center;
                margin-bottom: 10px;

                :deep(.el-checkbox) {
                    align-items: center;
                    line-height: 1.5;
                }

                :deep(.el-checkbox__label) {
                    color: var(--el-text-color-regular);
                    font-size: 13px;
                    padding-left: 6px;
                }
            }

            .format-tip {
                color: var(--el-text-color-secondary);
                margin-bottom: 10px;
                font-size: 12px;
                line-height: 1.6;
            }

            .download-link {
                font-weight: 500;
                font-size: 13px;
            }
        }
    }
}

:global(html.dark) {
    .system-user {
        .modern-splitpanes {
            :deep(.splitpanes__splitter::before) {
                background-color: var(--el-border-color-dark);
            }

            :deep(.splitpanes__pane) {
                background-color: var(--el-bg-color-overlay);
                border-color: var(--el-border-color-darker);
            }
        }

        .dept-wrapper {
            .tree-container {
                &::-webkit-scrollbar-thumb {
                    background-color: var(--el-border-color-darker);
                }
            }
        }

        .table-wrapper {
            border-color: var(--el-border-color-darker);
            background-color: var(--el-bg-color-overlay);

            .table-header {
                background-color: var(--el-fill-color-darker);
                border-bottom-color: var(--el-border-color-darker);
            }
        }

        .modern-upload {
            :deep(.el-upload-dragger) {
                background-color: var(--el-fill-color-darker);
                border-color: var(--el-border-color-darker);
            }

            .upload-tip {
                background-color: var(--el-fill-color-darker);
                border-color: var(--el-border-color-darker);
            }
        }
    }
}

@media screen and (max-width: 768px) {
    .system-user {
        padding: 12px;
        height: auto;
        min-height: calc(100vh - 84px);

        .modern-form {
            flex-direction: column;
            gap: 12px;

            .el-form-item {
                width: 100%;
            }

            .search-input,
            .date-range {
                width: 100%;
            }

            .form-actions {
                margin-left: 0;
                justify-content: flex-end;
            }
        }

        .table-wrapper {
            .table-header {
                flex-direction: column;
                align-items: stretch;
                gap: 12px;

                .right-tools {
                    margin-left: 0;
                    justify-content: flex-end;
                }
            }
        }
    }
}
</style>
