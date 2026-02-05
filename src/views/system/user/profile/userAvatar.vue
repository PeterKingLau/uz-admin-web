<template>
    <div class="user-avatar-wrapper" @click="editCropper()">
        <img :src="options.img" title="点击上传头像" class="avatar-img" />

        <el-dialog :title="title" v-model="open" width="800px" append-to-body @opened="modalOpened" @close="closeDialog" class="avatar-dialog">
            <div class="cropper-container">
                <el-row :gutter="20">
                    <el-col :span="14" class="cropper-col">
                        <div class="cropper-box">
                            <vue-cropper
                                ref="cropper"
                                :img="options.img"
                                :info="true"
                                :autoCrop="options.autoCrop"
                                :autoCropWidth="options.autoCropWidth"
                                :autoCropHeight="options.autoCropHeight"
                                :fixedBox="options.fixedBox"
                                :outputType="options.outputType"
                                @realTime="realTime"
                                v-if="visible"
                            />
                        </div>
                    </el-col>
                    <el-col :span="10" class="preview-col">
                        <div class="preview-box">
                            <div class="preview-img-wrapper">
                                <div :style="previewStyle" class="preview-inner">
                                    <img :src="options.previews.url" :style="options.previews.img" />
                                </div>
                            </div>
                            <div class="preview-text">头像预览</div>
                        </div>
                    </el-col>
                </el-row>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <div class="left-actions">
                        <el-upload action="#" accept="image/*" :http-request="requestUpload" :show-file-list="false" :before-upload="beforeUpload">
                            <el-button> 选择图片 <Icon icon="ep:upload" class="el-icon--right" /> </el-button>
                        </el-upload>
                    </div>

                    <div class="center-actions">
                        <el-button-group>
                            <el-button @click="changeScale(1)" title="放大"><Icon icon="ep:plus" class="action-icon" /></el-button>
                            <el-button @click="changeScale(-1)" title="缩小"><Icon icon="ep:minus" class="action-icon" /></el-button>
                            <el-button @click="rotateLeft()" title="左旋转"><Icon icon="ep:refresh-left" class="action-icon" /></el-button>
                            <el-button @click="rotateRight()" title="右旋转"><Icon icon="ep:refresh-right" class="action-icon" /></el-button>
                        </el-button-group>
                    </div>

                    <div class="right-actions">
                        <el-button type="primary" @click="uploadImg()">提 交</el-button>
                    </div>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import 'vue-cropper/dist/index.css'
import { VueCropper } from 'vue-cropper'
import { uploadAvatar } from '@/api/system/user'
import useUserStore from '@/store/modules/user'
import { ref, reactive, getCurrentInstance, computed } from 'vue'
import { getImgUrl } from '@/utils/img'

const userStore = useUserStore()
const { proxy } = getCurrentInstance()

const open = ref(false)
const visible = ref(false)
const title = ref('修改头像')

const options = reactive({
    img: userStore.avatar,
    autoCrop: true,
    autoCropWidth: 200,
    autoCropHeight: 200,
    fixedBox: true,
    outputType: 'png',
    filename: 'avatar',
    previews: {
        url: '',
        img: '',
        div: {},
        w: 0,
        h: 0
    }
})

const previewStyle = computed(() => {
    if (!options.previews || !options.previews.div) {
        return {
            width: '200px',
            height: '200px',
            overflow: 'hidden',
            borderRadius: '50%',
            margin: '0'
        }
    }

    return {
        ...options.previews.div,
        borderRadius: '50%',
        overflow: 'hidden',
        margin: '0'
    }
})

function editCropper() {
    open.value = true
}

function modalOpened() {
    visible.value = true
}

function requestUpload() {}

function rotateLeft() {
    proxy.$refs.cropper.rotateLeft()
}

function rotateRight() {
    proxy.$refs.cropper.rotateRight()
}

function changeScale(num) {
    num = num || 1
    proxy.$refs.cropper.changeScale(num)
}

function beforeUpload(file) {
    if (file.type.indexOf('image/') == -1) {
        proxy.$modal.msgError('文件格式错误，请上传图片类型,如：JPG，PNG后缀的文件。')
        return false
    } else {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            options.img = reader.result
            options.filename = file.name
        }
    }
    return false
}

function uploadImg() {
    proxy.$refs.cropper.getCropBlob(data => {
        let formData = new FormData()
        formData.append('avatarfile', data, options.filename)
        uploadAvatar(formData).then(response => {
            open.value = false
            options.img = getImgUrl(response.imgUrl)
            userStore.avatar = options.img
            proxy.$modal.msgSuccess('修改成功')
            visible.value = false
        })
    })
}

function realTime(data) {
    options.previews = data
}

function closeDialog() {
    options.img = userStore.avatar
    visible.value = false
}
</script>

<style lang="scss" scoped>
.user-avatar-wrapper {
    position: relative;
    display: inline-block;
    width: 100%;
    height: 100%;
    cursor: pointer;
    overflow: hidden;
    border-radius: 50%;

    .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    &:hover::after {
        content: '+';
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        color: #fff;
        font-size: 24px;
        border-radius: 50%;
    }
}

.cropper-container {
    padding: 0 20px;
}

.cropper-box {
    height: 350px;
    width: 100%;
}

.preview-col {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 350px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
}

.preview-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;

    .preview-img-wrapper {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        background-color: var(--el-bg-color);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .preview-inner {
        display: block;
    }

    .preview-text {
        color: var(--el-text-color-secondary);
        font-size: 14px;
        font-weight: 500;
    }
}

.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;

    .center-actions {
        flex: 1;
        display: flex;
        justify-content: center;
    }
}

.action-icon {
    font-size: 16px;
}

:deep(.avatar-dialog) {
    .el-dialog__header {
        padding: 20px;
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .el-dialog__body {
        padding: 20px;
    }

    .el-dialog__footer {
        padding: 15px 20px;
        border-top: 1px solid var(--el-border-color-lighter);
    }
}
</style>
