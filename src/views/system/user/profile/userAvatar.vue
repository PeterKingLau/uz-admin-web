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
                            <div class="preview-img-wrapper" :style="previewStyle">
                                <div :style="options.previews.div" class="preview-inner">
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
                        <el-upload action="#" :http-request="requestUpload" :show-file-list="false" :before-upload="beforeUpload">
                            <el-button
                                >选择图片 <el-icon class="el-icon--right"><Upload /></el-icon
                            ></el-button>
                        </el-upload>
                    </div>

                    <div class="center-actions">
                        <el-button-group>
                            <el-button icon="Plus" @click="changeScale(1)" title="放大"></el-button>
                            <el-button icon="Minus" @click="changeScale(-1)" title="缩小"></el-button>
                            <el-button icon="RefreshLeft" @click="rotateLeft()" title="左旋转"></el-button>
                            <el-button icon="RefreshRight" @click="rotateRight()" title="右旋转"></el-button>
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
    previews: {}
})

const previewStyle = computed(() => {
    return {
        width: options.previews.w + 'px',
        height: options.previews.h + 'px',
        overflow: 'hidden',
        margin: '0',
        zoom: 200 / options.previews.w // 缩放预览图以适应容器
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
    } else {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            options.img = reader.result
            options.filename = file.name
        }
    }
}

function uploadImg() {
    proxy.$refs.cropper.getCropBlob(data => {
        let formData = new FormData()
        formData.append('avatarfile', data, options.filename)
        uploadAvatar(formData).then(response => {
            open.value = false
            options.img = import.meta.env.VITE_APP_BASE_API + response.imgUrl
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
    border-radius: 50%; /* 保持圆形 */

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

    .preview-img-wrapper {
        border-radius: 50%;
        box-shadow: 0 0 4px #ccc;
    }

    .preview-text {
        margin-top: 10px;
        color: var(--el-text-color-secondary);
        font-size: 14px;
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
</style>
