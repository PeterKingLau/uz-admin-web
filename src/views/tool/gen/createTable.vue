<template>
    <el-dialog title="创建表" v-model="visible" width="900px" top="5vh" append-to-body>
        <el-row :gutter="20">
            <el-col :span="24">
                <div class="mb-2">创建表语句(支持多个建表语句)：</div>
                <el-input
                    type="textarea"
                    :rows="10"
                    placeholder="请输入CREATE TABLE语句，例如：CREATE TABLE sys_user (id int) COMMENT '用户表';"
                    v-model="content"
                    style="font-family: monospace"
                ></el-input>
            </el-col>
            <el-col :span="24" class="mt-4">
                <div class="mb-2">
                    <span>解析预览：</span>
                    <el-tag v-if="previewList.length > 0" type="success">共识别到 {{ previewList.length }} 张表</el-tag>
                    <el-tag v-else type="info">暂无有效语句</el-tag>
                </div>
                <el-table :data="previewList" border stripe height="200px" style="width: 100%">
                    <el-table-column prop="tableName" label="表名称" min-width="150" />
                    <el-table-column prop="tableComment" label="表描述" min-width="200" show-overflow-tooltip />
                    <el-table-column label="状态" width="100" align="center">
                        <template #default>
                            <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
                        </template>
                    </el-table-column>
                </el-table>
            </el-col>
        </el-row>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="handleImportTable" :disabled="previewList.length === 0">确 定</el-button>
                <el-button @click="visible = false">取 消</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { createTable } from '@/api/tool/gen'
import { ref, getCurrentInstance, watch } from 'vue'

const visible = ref(false)
const content = ref('')
const previewList = ref([])
const { proxy } = getCurrentInstance()
const emit = defineEmits(['ok'])

function show() {
    visible.value = true
    content.value = ''
    previewList.value = []
}

watch(content, val => {
    previewList.value = []
    if (!val || val.trim() === '') return

    const sqlStatements = val.split(';')

    sqlStatements.forEach(sql => {
        const cleanSql = sql.trim().replace(/[\r\n]/g, ' ')
        if (!cleanSql) return

        const tableNameMatch = cleanSql.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:`|'|")?([a-zA-Z0-9_]+)(?:`|'|")?/i)
        const tableCommentMatch = cleanSql.match(/comment\s*=\s*(?:'|")([^'"]+)(?:'|")/i)

        if (tableNameMatch && tableNameMatch[1]) {
            previewList.value.push({
                tableName: tableNameMatch[1],
                tableComment: tableCommentMatch ? tableCommentMatch[1] : '暂无描述'
            })
        }
    })
})

function handleImportTable() {
    if (content.value === '') {
        proxy.$modal.msgError('请输入建表语句')
        return
    }
    if (previewList.value.length === 0) {
        proxy.$modal.msgError('未识别到有效的CREATE TABLE语句，请检查SQL格式')
        return
    }

    createTable({ sql: content.value }).then(res => {
        proxy.$modal.msgSuccess(res.msg)
        if (res.code === 200) {
            visible.value = false
            emit('ok')
        }
    })
}

defineExpose({
    show
})
</script>
