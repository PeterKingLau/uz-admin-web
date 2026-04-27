<template>
    <div class="app-container version-manage">
        <el-card class="version-form-card" shadow="never">
            <template #header>
                <div class="card-header">
                    <span class="title">APK 版本管理</span>
                </div>
            </template>

            <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="version-form" label-position="right">
                <el-row :gutter="32">
                    <el-col :xs="24" :md="12">
                        <el-form-item label="版本号" prop="versionCode">
                            <el-input-number v-model="form.versionCode" :min="1" :precision="0" :step="1" controls-position="right" class="custom-input" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :md="12">
                        <el-form-item label="版本名称" prop="versionName">
                            <el-input v-model="form.versionName" placeholder="例如：1.0.1" clearable class="custom-input" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :md="24">
                        <el-form-item label="更新日志" prop="releaseNotes">
                            <el-input
                                v-model="form.releaseNotes"
                                type="textarea"
                                :rows="4"
                                maxlength="2000"
                                show-word-limit
                                resize="none"
                                placeholder="请输入更新日志，支持多行文本"
                                class="custom-textarea"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :md="12">
                        <el-form-item label="是否强制更新" prop="isForceUpdate">
                            <div class="force-update-wrapper">
                                <el-radio-group v-model="form.isForceUpdate" class="custom-radio">
                                    <el-radio value="0" border>否</el-radio>
                                    <el-radio value="1" border>是</el-radio>
                                </el-radio-group>
                                <el-alert
                                    title="发布新版本包时，为保证用户体验，强烈建议勾选【是】"
                                    type="warning"
                                    show-icon
                                    :closable="false"
                                    class="force-update-alert"
                                />
                            </div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :md="12">
                        <el-form-item label="APK 文件" required>
                            <div class="upload-wrapper" :class="{ 'has-error': fileError }">
                                <el-upload
                                    v-model:file-list="uploadFileList"
                                    :auto-upload="false"
                                    :limit="1"
                                    drag
                                    accept=".apk,application/vnd.android.package-archive"
                                    :before-upload="beforeUpload"
                                    :on-change="handleFileChange"
                                    :on-remove="handleFileRemove"
                                    :on-exceed="handleFileExceed"
                                    class="custom-upload"
                                >
                                    <div class="upload-drag-area">
                                        <Icon icon="mdi:cloud-upload-outline" class="upload-icon" />
                                        <div class="upload-text">将 APK 文件拖到此处，或 <em>点击上传</em></div>
                                    </div>
                                    <template #tip>
                                        <div class="upload-tip-wrapper">
                                            <div class="el-upload__tip upload-tip">
                                                <Icon icon="mdi:information-outline" class="tip-icon" />
                                                <span>仅支持 APK 文件，大小不超过 {{ maxApkSizeMB }}MB</span>
                                            </div>
                                            <div v-if="fileError" class="file-error">{{ fileError }}</div>
                                        </div>
                                    </template>
                                </el-upload>
                            </div>
                        </el-form-item>
                    </el-col>
                </el-row>

                <div class="form-footer">
                    <el-button class="btn-reset" @click="handleReset" size="large">重置内容</el-button>
                    <el-button class="btn-submit" type="primary" :loading="submitting" @click="handleSubmit" size="large">
                        <Icon icon="mdi:check" class="submit-icon" v-if="!submitting" />
                        上传并新增版本
                    </el-button>
                </div>
            </el-form>
        </el-card>

        <el-card class="version-table-card" shadow="never">
            <template #header>
                <div class="table-header">
                    <span class="title">版本记录</span>
                    <div class="table-tools">
                        <el-button plain @click="getList" :loading="loading" class="tool-btn"> <Icon icon="mdi:refresh" /> 刷新 </el-button>
                        <el-button type="danger" :disabled="!selectedRows.length" :loading="deleting" @click="handleDelete()" class="tool-btn">
                            <Icon icon="mdi:delete-outline" /> 批量删除
                        </el-button>
                    </div>
                </div>
            </template>

            <el-table v-loading="tableLoading" :data="versionList" class="custom-table" row-key="id" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="版本号" prop="versionCode" align="center" width="100">
                    <template #default="{ row }">
                        <span class="version-code-badge">{{ row.versionCode }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="版本名称" prop="versionName" align="center" width="140">
                    <template #default="{ row }">
                        <span class="version-name-text">v{{ row.versionName }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="平台" prop="platform" align="center" width="100">
                    <template #default="{ row }">
                        <div class="platform-badge">
                            <Icon icon="mdi:android" class="platform-icon" v-if="row.platform?.toLowerCase() === 'android'" />
                            <span>{{ row.platform }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="是否强制" prop="isForceUpdate" align="center" width="120">
                    <template #default="{ row }">
                        <el-tag :type="row.isForceUpdate === '1' ? 'danger' : 'info'" effect="light" round class="status-tag">
                            {{ row.isForceUpdate === '1' ? '强制更新' : '普通更新' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="状态" prop="status" align="center" width="100">
                    <template #default="{ row }">
                        <div class="status-dot-wrapper">
                            <span class="status-dot" :class="row.status === '1' ? 'success' : 'info'"></span>
                            <span>{{ row.status === '1' ? '启用' : '停用' }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="下载地址" prop="downloadUrl" min-width="260">
                    <template #default="{ row }">
                        <div v-if="row.downloadUrl" class="download-cell">
                            <a :href="resolveDownloadUrl(row.downloadUrl)" target="_blank" rel="noopener noreferrer" class="download-link">
                                <Icon icon="mdi:link-variant" />
                                {{ resolveDownloadUrl(row.downloadUrl) }}
                            </a>
                            <el-button link type="primary" class="download-qr-btn" @click="handleOpenDownloadQr(row)">
                                <Icon icon="mdi:qrcode" />
                                二维码
                            </el-button>
                        </div>
                        <span v-else class="empty-text">-</span>
                    </template>
                </el-table-column>
                <el-table-column label="更新日志" prop="releaseNotes" min-width="220" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span class="log-text">{{ row.releaseNotes || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" prop="createTime" align="center" width="180">
                    <template #default="{ row }">
                        <span class="time-text">{{ formatTime(row.createTime) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="120" fixed="right">
                    <template #default="{ row }">
                        <el-tooltip content="删除" placement="bottom" :show-after="500">
                            <div class="action-icon-btn danger" @click="handleDelete(row)">
                                <Icon icon="mdi:trash-can-outline" />
                            </div>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
            </div>
        </el-card>

        <QrcodeDialog v-model="qrcodeVisible" :text="qrcodeText" :title="qrcodeTitle" :description="qrcodeDescription" :file-name="qrcodeFileName" />
    </div>
</template>

<script setup lang="ts" name="ContentVersionManage">
import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules, UploadFile, UploadFiles, UploadRawFile, UploadUserFile } from 'element-plus'
import { parseTime } from '@/utils/utils'
import { getImgUrl } from '@/utils/img'
import { addVersion, deleteVersion, listVersion, parseVersionRows, parseVersionTotal } from '@/api/content/version'
import type { VersionItem } from '@/api/content/version.types'
import QrcodeDialog from '../postInfo/components/QrcodeDialog.vue'

interface VersionTableItem {
    id: number | string
    platform: string
    versionCode: number | string
    versionName: string
    downloadUrl: string
    releaseNotes: string
    isForceUpdate: string
    status: string
    createTime: string
}

interface FormModel {
    versionCode: number
    versionName: string
    releaseNotes: string
    isForceUpdate: string
}

const maxApkSizeMB = 600

const { proxy } = getCurrentInstance() as any
const formRef = ref<FormInstance>()
const submitting = ref(false)
const loading = ref(false)
const deleting = ref(false)
const fileError = ref('')
const total = ref(0)
const uploadFileList = ref<UploadUserFile[]>([])
const selectedFile = ref<File | null>(null)
const selectedRows = ref<VersionTableItem[]>([])
const versionList = ref<VersionTableItem[]>([])
const qrcodeVisible = ref(false)
const qrcodeText = ref('')
const qrcodeTitle = ref('')
const qrcodeDescription = ref('')
const qrcodeFileName = ref('')
const queryParams = reactive({
    pageNum: 1,
    pageSize: 10
})

const tableLoading = computed(() => loading.value || deleting.value)

const createDefaultForm = (): FormModel => ({
    versionCode: 1,
    versionName: '',
    releaseNotes: '',
    isForceUpdate: '0'
})

const form = reactive<FormModel>(createDefaultForm())

const rules: FormRules<FormModel> = {
    versionCode: [
        { required: true, message: '版本号不能为空', trigger: 'blur' },
        {
            validator: (_rule, value, callback) => {
                if (!Number.isFinite(Number(value)) || Number(value) < 1) {
                    callback(new Error('版本号必须是大于等于 1 的数字'))
                    return
                }
                callback()
            },
            trigger: 'blur'
        }
    ],
    versionName: [{ required: true, message: '版本名称不能为空', trigger: 'blur' }],
    releaseNotes: [{ required: true, message: '更新日志不能为空', trigger: 'blur' }],
    isForceUpdate: [{ required: true, message: '请选择是否强制更新', trigger: 'change' }]
}

const isApkFile = (fileName: string): boolean => /\.apk$/i.test(fileName)

const beforeUpload = (rawFile: UploadRawFile): boolean => {
    const fileName = String(rawFile.name || '')
    if (!isApkFile(fileName)) {
        proxy?.$modal?.msgError?.('仅支持上传 APK 文件')
        return false
    }
    const isWithinSize = rawFile.size / 1024 / 1024 <= maxApkSizeMB
    if (!isWithinSize) {
        proxy?.$modal?.msgError?.(`APK 文件大小不能超过 ${maxApkSizeMB}MB`)
        return false
    }
    return true
}

const handleFileChange = (file: UploadFile, fileList: UploadFiles) => {
    const raw = file.raw as UploadRawFile | undefined
    if (!raw) {
        selectedFile.value = null
        uploadFileList.value = []
        return
    }

    if (!isApkFile(raw.name)) {
        proxy?.$modal?.msgError?.('仅支持上传 APK 文件')
        selectedFile.value = null
        uploadFileList.value = []
        return
    }

    const isWithinSize = raw.size / 1024 / 1024 <= maxApkSizeMB
    if (!isWithinSize) {
        proxy?.$modal?.msgError?.(`APK 文件大小不能超过 ${maxApkSizeMB}MB`)
        selectedFile.value = null
        uploadFileList.value = []
        return
    }

    selectedFile.value = raw as File
    uploadFileList.value = fileList.slice(-1)
    fileError.value = ''
}

const handleFileRemove = () => {
    selectedFile.value = null
    uploadFileList.value = []
}

const handleFileExceed = () => {
    proxy?.$modal?.msgWarning?.('仅支持上传一个 APK 文件')
}

const handleSelectionChange = (rows: VersionTableItem[]) => {
    selectedRows.value = rows || []
}

const formatTime = (time: string) => {
    const value = parseTime(time)
    return value || ''
}

const resolveDownloadUrl = (url: string) => {
    const raw = String(url || '').trim()
    return raw ? getImgUrl(raw) : ''
}

const resolveQrFileName = (row: VersionTableItem) => {
    const versionSeed = String(row.versionName || row.versionCode || 'version').trim()
    const sanitizedVersion = versionSeed
        .replace(/[^\w.-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    const fallback = sanitizedVersion || 'version'
    return `apk-download-${fallback}-${Date.now()}.png`
}

const handleOpenDownloadQr = (row: VersionTableItem) => {
    const text = resolveDownloadUrl(row.downloadUrl)
    if (!text) {
        proxy?.$modal?.msgWarning?.('下载地址为空，无法生成二维码')
        return
    }
    const versionText = String(row.versionName || row.versionCode || '').trim()
    qrcodeText.value = text
    qrcodeTitle.value = versionText ? `APK 下载二维码 - v${versionText}` : 'APK 下载二维码'
    qrcodeDescription.value = text
    qrcodeFileName.value = resolveQrFileName(row)
    qrcodeVisible.value = true
}

const normalizeRecord = (row: VersionItem | undefined, fallback?: FormModel, index = 0): VersionTableItem => ({
    id: row?.id ?? `local_${Date.now()}_${index}`,
    platform: String(row?.platform || 'android'),
    versionCode: row?.versionCode ?? fallback?.versionCode ?? '',
    versionName: String(row?.versionName || fallback?.versionName || ''),
    downloadUrl: String(row?.downloadUrl || ''),
    releaseNotes: String(row?.releaseNotes || fallback?.releaseNotes || ''),
    isForceUpdate: String(row?.isForceUpdate ?? fallback?.isForceUpdate ?? '0'),
    status: String(row?.status ?? '1'),
    createTime: String(row?.createTime || new Date().toISOString())
})

const getList = async () => {
    loading.value = true
    try {
        const response = await listVersion({
            pageNum: queryParams.pageNum,
            pageSize: queryParams.pageSize
        })
        const rows = parseVersionRows(response)
        versionList.value = rows.map((item, index) => normalizeRecord(item, undefined, index))
        total.value = parseVersionTotal(response)
    } catch (error) {
        console.error(error)
        versionList.value = []
        total.value = 0
    } finally {
        loading.value = false
        selectedRows.value = []
    }
}

const handleReset = () => {
    Object.assign(form, createDefaultForm())
    selectedFile.value = null
    uploadFileList.value = []
    fileError.value = ''
    formRef.value?.clearValidate()
}

const handleSubmit = async () => {
    const currentFormRef = formRef.value
    if (!currentFormRef || submitting.value) return

    try {
        await currentFormRef.validate()
    } catch {
        return
    }

    if (!(selectedFile.value instanceof File)) {
        fileError.value = '请上传 APK 文件'
        return
    }

    submitting.value = true
    try {
        const response = await addVersion({
            versionCode: form.versionCode,
            versionName: form.versionName.trim(),
            releaseNotes: form.releaseNotes.trim(),
            isForceUpdate: form.isForceUpdate,
            file: selectedFile.value
        })
        proxy?.$modal?.msgSuccess?.(response?.msg || '新增版本成功')
        handleReset()
        queryParams.pageNum = 1
        await getList()
    } catch (error) {
        console.error(error)
    } finally {
        submitting.value = false
    }
}

const handleDelete = async (row?: VersionTableItem) => {
    if (deleting.value) return

    const targetRows = row ? [row] : selectedRows.value
    if (!targetRows.length) {
        proxy?.$modal?.msgWarning?.('请先选择要删除的版本')
        return
    }

    const labels = targetRows.map(item => item.versionName || item.versionCode).join('、')
    try {
        await proxy?.$modal?.confirm?.(`确认删除版本「${labels}」吗？`)
    } catch {
        return
    }

    const serverIds = targetRows.map(item => String(item.id)).filter(id => id && !id.startsWith('local_'))

    deleting.value = true
    try {
        if (serverIds.length) {
            const response = await deleteVersion(serverIds)
            proxy?.$modal?.msgSuccess?.(response?.msg || '删除成功')

            if (targetRows.length >= versionList.value.length && queryParams.pageNum > 1) {
                queryParams.pageNum -= 1
            }
            await getList()
        } else {
            const removeIdSet = new Set(targetRows.map(item => String(item.id)))
            versionList.value = versionList.value.filter(item => !removeIdSet.has(String(item.id)))
            selectedRows.value = []
            total.value = Math.max(0, total.value - targetRows.length)
            proxy?.$modal?.msgSuccess?.('删除成功')
        }
    } catch (error) {
        console.error(error)
    } finally {
        deleting.value = false
    }
}

onMounted(() => {
    getList()
})
</script>

<style scoped lang="scss">
.version-manage {
    padding: 24px;
    background-color: var(--el-bg-color-page);
    min-height: calc(100vh - 84px);

    .version-form-card,
    .version-table-card {
        border-radius: 16px;
        border: none;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        background: var(--el-bg-color);
        transition:
            box-shadow 0.24s cubic-bezier(0.2, 0, 0.2, 1),
            background-color 0.24s cubic-bezier(0.2, 0, 0.2, 1);

        &:hover {
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
            background: color-mix(in srgb, var(--el-bg-color) 96%, var(--el-fill-color-light));
        }

        :deep(.el-card__header) {
            padding: 20px 24px;
            border-bottom: 1px solid var(--el-border-color-lighter);
        }

        :deep(.el-card__body) {
            padding: 28px 24px;
        }
    }

    .version-form-card {
        margin-bottom: 20px;
    }

    .card-header,
    .table-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .title {
            font-size: 16px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            position: relative;
            padding-left: 12px;
            display: flex;
            align-items: center;

            &::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 16px;
                background: linear-gradient(180deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
                border-radius: 2px;
            }
        }
    }

    .table-tools {
        display: flex;
        align-items: center;
        gap: 12px;

        .tool-btn {
            border-radius: 8px;
            padding: 8px 16px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-weight: 500;
            transition: all 0.2s;

            &:hover {
                transform: translateY(-1px);
            }
        }
    }

    .version-form {
        :deep(.el-form-item__label) {
            font-weight: 600;
            color: var(--el-text-color-regular);
        }

        .custom-input {
            :deep(.el-input__wrapper) {
                border-radius: 8px;
                box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
                background-color: var(--el-fill-color-blank);
                transition: all 0.2s;

                &:hover {
                    box-shadow: 0 0 0 1px var(--el-border-color) inset;
                }

                &.is-focus {
                    box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
                    background-color: var(--el-color-primary-light-9);
                }
            }
        }

        .custom-textarea {
            :deep(.el-textarea__inner) {
                border-radius: 12px;
                padding: 12px 16px;
                box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
                background-color: var(--el-fill-color-blank);
                transition: all 0.2s;
                line-height: 1.6;

                &:hover {
                    box-shadow: 0 0 0 1px var(--el-border-color) inset;
                }

                &:focus {
                    box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
                    background-color: var(--el-color-primary-light-9);
                }
            }
        }

        .force-update-wrapper {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;

            .force-update-alert {
                border-radius: 8px;
                padding: 6px 12px;

                :deep(.el-alert__title) {
                    font-size: 12px;
                    line-height: 1.4;
                }
            }
        }

        .custom-radio {
            :deep(.el-radio.is-bordered) {
                border-radius: 8px;
                border-color: var(--el-border-color-lighter);
                transition: all 0.2s;

                &:hover {
                    border-color: var(--el-color-primary-light-5);
                }

                &.is-checked {
                    border-color: var(--el-color-primary);
                    background-color: var(--el-color-primary-light-9);
                }
            }
        }
    }

    .upload-wrapper {
        width: 100%;
        border-radius: 12px;
        transition: all 0.3s ease;

        &.has-error {
            :deep(.el-upload-dragger) {
                border-color: var(--el-color-danger);
                background-color: var(--el-color-danger-light-9);
            }
        }
    }

    .custom-upload {
        width: 100%;

        :deep(.el-upload-dragger) {
            border-radius: 12px;
            background-color: var(--el-fill-color-light);
            border: 1px dashed var(--el-border-color);
            padding: 30px;
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            &:hover {
                background-color: var(--el-color-primary-light-9);
                border-color: var(--el-color-primary);
            }
        }

        .upload-drag-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;

            .upload-icon {
                font-size: 48px;
                color: var(--el-color-primary-light-3);
                transition: transform 0.3s;
            }

            .upload-text {
                font-size: 14px;
                color: var(--el-text-color-regular);

                em {
                    color: var(--el-color-primary);
                    font-style: normal;
                    font-weight: 600;
                }
            }
        }

        &:hover .upload-icon {
            transform: translateY(-4px);
            color: var(--el-color-primary);
        }

        :deep(.el-upload-list__item) {
            border-radius: 8px;
            border: 1px solid var(--el-border-color-lighter);
            background: var(--el-fill-color-blank);
            margin-top: 12px;
        }
    }

    .upload-tip-wrapper {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .upload-tip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--el-color-primary-light-9);
        border-radius: 6px;
        color: var(--el-color-primary);
        font-size: 12px;
        margin: 0;

        .tip-icon {
            font-size: 14px;
        }
    }

    .file-error {
        color: var(--el-color-danger);
        font-size: 12px;
        line-height: 1.2;
        padding-left: 4px;
    }

    .form-footer {
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px dashed var(--el-border-color-lighter);

        .btn-reset,
        .btn-submit {
            border-radius: 8px;
            font-weight: 600;
            padding: 0 24px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }

        .btn-submit {
            box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);

            &:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.3);
            }
        }
    }

    .custom-table {
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--el-border-color-lighter);

        :deep(th.el-table__cell) {
            background-color: var(--el-fill-color-light);
            color: var(--el-text-color-primary);
            font-weight: 600;
            height: 50px;
            border-bottom: 1px solid var(--el-border-color-lighter);
        }

        :deep(td.el-table__cell) {
            padding: 12px 0;
            border-bottom: 1px solid var(--el-border-color-extra-light);
        }

        .version-code-badge {
            display: inline-block;
            padding: 2px 8px;
            background: var(--el-fill-color);
            border-radius: 6px;
            font-family: monospace;
            font-size: 13px;
            color: var(--el-text-color-regular);
            border: 1px solid var(--el-border-color-lighter);
        }

        .version-name-text {
            font-weight: 600;
            color: var(--el-color-primary);
            font-size: 14px;
        }

        .platform-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: var(--el-text-color-regular);

            .platform-icon {
                color: #3ddc84;
                font-size: 16px;
            }
        }

        .status-tag {
            border: none;
            font-weight: 500;
        }

        .status-dot-wrapper {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: var(--el-text-color-regular);

            .status-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;

                &.success {
                    background-color: var(--el-color-success);
                    box-shadow: 0 0 0 2px var(--el-color-success-light-8);
                }

                &.info {
                    background-color: var(--el-text-color-disabled);
                    box-shadow: 0 0 0 2px var(--el-fill-color);
                }
            }
        }

        .download-link {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: var(--el-color-primary);
            text-decoration: none;
            font-size: 13px;
            transition: color 0.2s;
            width: 100%;
            min-width: 0;
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            &:hover {
                color: var(--el-color-primary-light-3);
                text-decoration: underline;
            }
        }

        .download-cell {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 10px;
            min-width: 0;
            width: 100%;
        }

        .download-qr-btn {
            flex-shrink: 0;
            height: auto;
            padding: 0;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            line-height: 1;
        }

        .empty-text {
            color: var(--el-text-color-placeholder);
        }

        .log-text {
            font-size: 13px;
            color: var(--el-text-color-regular);
            line-height: 1.5;
        }

        .time-text {
            font-size: 13px;
            color: var(--el-text-color-secondary);
        }

        .action-icon-btn {
            width: 30px;
            height: 30px;
            margin: 0 auto;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--el-text-color-secondary);
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
                background-color: var(--el-fill-color-light);
                color: var(--el-color-primary);
                transform: translateY(-1px);
            }

            &.danger:hover {
                background-color: var(--el-color-danger-light-9);
                color: var(--el-color-danger);
            }
        }
    }

    .pagination-container {
        margin-top: 24px;
        display: flex;
        justify-content: flex-end;
    }
}
</style>
