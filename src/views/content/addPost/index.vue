<template>
    <div class="app-container">
        <el-card shadow="hover" class="post-card">
            <template #header>
                <div class="card-header">
                    <span>发布内容</span>
                </div>
            </template>

            <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" class="post-form">
                <el-form-item label="内容类型" prop="postType">
                    <el-radio-group v-model="form.postType">
                        <el-radio-button :label="POST_TYPE.TEXT">纯文字</el-radio-button>
                        <el-radio-button :label="POST_TYPE.IMAGE">图片</el-radio-button>
                        <el-radio-button :label="POST_TYPE.VIDEO">视频</el-radio-button>
                    </el-radio-group>
                </el-form-item>

                <el-form-item label="正文内容" prop="content">
                    <el-input
                        v-model="form.content"
                        type="textarea"
                        :rows="6"
                        placeholder="请输入内容（纯文字时必填，图文/视频时可作为说明）"
                        maxlength="2000"
                        show-word-limit
                        @input="handleContentInput"
                    />
                </el-form-item>

                <el-form-item label="标签" prop="tagStr">
                    <div class="tag-select-wrapper">
                        <el-skeleton v-if="interestLoading" :rows="2" animated />
                        <template v-else>
                            <el-select
                                v-model="selectedTagIds"
                                multiple
                                filterable
                                placeholder="请选择标签"
                                :style="{ width: '420px' }"
                                clearable
                                :disabled="!hasTagOptions"
                            >
                                <template v-for="cate in interestTree" :key="cate.id">
                                    <el-option-group v-if="cate.children?.length" :label="cate.name">
                                        <el-option v-for="child in cate.children" :key="child.id" :label="child.name" :value="child.id" class="tag-option">
                                            <el-tag size="small" type="success" effect="plain" class="tag-option__tag">
                                                {{ child.name }}
                                            </el-tag>
                                        </el-option>
                                    </el-option-group>
                                </template>
                            </el-select>
                            <div v-if="!hasTagOptions" class="tag-empty-tip">暂无标签配置，可联系管理员在后台维护</div>
                        </template>
                    </div>

                    <div v-if="selectedTagIds.length" class="tag-selected-tip">
                        已选 {{ selectedTagIds.length }} 个标签：
                        <span class="tag-selected-text">
                            {{ selectedTagNames.join('、') }}
                        </span>
                    </div>
                    <div v-else class="tag-helper-tip">建议选择 1~3 个标签</div>
                </el-form-item>

                <el-form-item v-if="form.postType === '2' || form.postType === '3'" label="上传文件" prop="files">
                    <el-upload
                        v-model:file-list="fileList"
                        :auto-upload="false"
                        :multiple="form.postType === '2'"
                        :limit="form.postType === '2' ? 9 : 1"
                        :accept="uploadAccept"
                        :on-exceed="handleExceed"
                        :before-upload="beforeUpload"
                        list-type="text"
                        class="post-upload"
                    >
                        <el-button type="primary">
                            <el-icon class="el-icon--left">
                                <Icon icon="ep:upload" />
                            </el-icon>
                            选择{{ form.postType === '2' ? '图片' : '视频' }}
                        </el-button>
                        <template #tip>
                            <div class="el-upload__tip">
                                <template v-if="form.postType === '2'"> 支持多张图片，建议 JPG/PNG，最多 9 张。 </template>
                                <template v-else> 支持单个视频文件，建议 MP4。 </template>
                            </div>
                        </template>
                    </el-upload>
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" :loading="submitting" @click="handleSubmit">
                        <el-icon class="el-icon--left">
                            <Icon icon="ep:promotion" />
                        </el-icon>
                        提 交
                    </el-button>
                    <el-button :disabled="submitting" @click="handleReset">
                        <el-icon class="el-icon--left">
                            <Icon icon="ep:refresh" />
                        </el-icon>
                        重 置
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup name="ContentPost" lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, type UploadUserFile } from 'element-plus'
import { addPost } from '@/api/content/post'
import { POST_TYPE } from '@/utils/enum'
import { getInterestAll } from '@/api/content/interest'

const form = reactive({
    postType: POST_TYPE.TEXT,
    content: '',
    tagStr: ''
})

const fileList = ref<UploadUserFile[]>([])

interface InterestChild {
    id: number
    name: string
    description?: string | null
    categoryId: number
}

interface InterestCategory {
    id: number
    name: string
    code: string
    sortOrder: number
    children?: InterestChild[]
}

const interestTree = ref<InterestCategory[]>([])
const interestLoading = ref(false)

const selectedTagIds = ref<number[]>([])
const hasTagOptions = computed(() => interestTree.value.some(cate => Array.isArray(cate.children) && cate.children.length > 0))

const selectedTagNames = computed(() => {
    const names: string[] = []
    const idSet = new Set(selectedTagIds.value)
    interestTree.value.forEach(cate => {
        cate.children?.forEach(child => {
            if (idSet.has(child.id)) {
                names.push(child.name)
            }
        })
    })
    return names
})

const rules = {
    postType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
    content: [
        {
            validator: (rule: any, value: string, callback: (err?: Error) => void) => {
                if (form.postType === POST_TYPE.TEXT) {
                    if (!value || !String(value).trim()) {
                        callback(new Error('纯文字内容时，正文必填'))
                    } else {
                        callback()
                    }
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ],
    files: [
        {
            validator: (rule: any, value: any, callback: (err?: Error) => void) => {
                if (form.postType === POST_TYPE.IMAGE || form.postType === POST_TYPE.VIDEO) {
                    if (!fileList.value.length) {
                        callback(new Error(form.postType === POST_TYPE.IMAGE ? '请至少选择一张图片' : '请上传一个视频文件'))
                    } else {
                        callback()
                    }
                } else {
                    callback()
                }
            },
            trigger: 'change'
        }
    ]
}

const formRef = ref()
const submitting = ref(false)

const uploadAccept = computed(() => {
    if (form.postType === POST_TYPE.IMAGE) return 'image/*'
    if (form.postType === POST_TYPE.VIDEO) return 'video/*'
    return ''
})

async function loadInterest() {
    try {
        interestLoading.value = true
        const res = await getInterestAll()
        interestTree.value = res.data || res || []
    } catch (e) {
        console.error('loadInterest error', e)
        ElMessage.error('标签列表获取失败')
    } finally {
        interestLoading.value = false
    }
}

watch(
    () => selectedTagIds.value,
    ids => {
        form.tagStr = ids.join(',')
    },
    { deep: true }
)

function handleExceed() {
    ElMessage.warning(form.postType === POST_TYPE.IMAGE ? '最多只能上传 9 张图片' : '仅支持上传一个视频文件')
}

function beforeUpload(file: File) {
    if (form.postType === POST_TYPE.IMAGE) {
        if (!file.type.startsWith('image/')) {
            ElMessage.error('请选择图片文件')
            return false
        }
    }
    if (form.postType === POST_TYPE.VIDEO) {
        if (!file.type.startsWith('video/')) {
            ElMessage.error('请选择视频文件')
            return false
        }
    }
    return true
}

function handleContentInput() {
    if (form.postType !== '1') return
    formRef.value?.validateField('content')
}

function handleSubmit() {
    if (!formRef.value) return

    formRef.value.validate(async (valid: any) => {
        if (!valid) return

        try {
            await ElMessageBox.confirm('确认提交该内容吗？', '提示', {
                type: 'warning'
            })
        } catch {
            return
        }

        submitting.value = true
        try {
            const files: File[] =
                form.postType === POST_TYPE.IMAGE || form.postType === POST_TYPE.VIDEO
                    ? fileList.value.map(item => item.raw as File | undefined).filter((f): f is File => !!f)
                    : []

            await addPost({
                postType: form.postType,
                content: form.content?.trim() || '',
                tagStr: form.tagStr?.trim() || '',
                files
            })

            ElMessage.success('发布成功')
            handleReset(true)
        } catch (e) {
            console.error('addPost error', e)
            ElMessage.error('发布失败，请稍后重试')
        } finally {
            submitting.value = false
        }
    })
}

function handleReset(keepType = false) {
    const currentType = form.postType
    form.postType = keepType ? currentType : POST_TYPE.TEXT
    form.content = ''
    form.tagStr = ''
    fileList.value = []
    selectedTagIds.value = []
    formRef.value?.clearValidate()
}

onMounted(() => {
    loadInterest()
})
</script>

<style lang="scss" scoped>
.app-container {
    display: flex;
    justify-content: center;
}

.post-card {
    width: 860px;
    max-width: 100%;
}

.card-header {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    letter-spacing: 1px;
}

.post-form {
    .el-form-item {
        max-width: 800px;
    }

    .el-form-item__tip {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-left: 10px;

        code {
            background: rgba(0, 0, 0, 0.04);
            padding: 0 3px;
            border-radius: 3px;
        }
    }
}

/* 标签区域样式 */
.tag-select-wrapper {
    width: 100%;
}

.tag-option {
    display: flex;
    align-items: center;
    gap: 8px;
}

.tag-option__tag {
    pointer-events: none;
}

.tag-option__cate {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.tag-selected-tip {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.tag-selected-text {
    color: var(--el-color-primary);
}

.tag-helper-tip,
.tag-empty-tip {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

/* 上传列表 */
.post-upload {
    width: 100%;

    :deep(.el-upload-list) {
        margin-top: 8px;
    }
}
</style>
