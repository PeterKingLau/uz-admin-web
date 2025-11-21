<template>
    <div class="container">
        <div class="left-board">
            <div class="logo-wrapper">
                <div class="logo">
                    <img :src="logo" alt="logo" />
                    可视化表单设计器
                </div>
            </div>

            <el-scrollbar class="left-scrollbar">
                <div class="components-list">
                    <div class="components-title">
                        <Icon icon="mdi:view-grid-outline" class="components-title__icon" />
                        <span class="components-title__text">输入型组件</span>
                    </div>

                    <VueDraggable
                        class="components-draggable"
                        v-model="inputComponents"
                        :group="{ name: 'componentsGroup', pull: 'clone', put: false }"
                        :sort="false"
                        :animation="200"
                    >
                        <template #default>
                            <div
                                v-for="(element, index) in inputComponents"
                                :key="element.tag + '-' + index"
                                class="components-item"
                                @click="addComponent(element)"
                            >
                                <div class="components-body">
                                    <Icon :icon="iconMap[element.tagIcon]" class="svg-icon" />
                                    {{ element.label }}
                                </div>
                            </div>
                        </template>
                    </VueDraggable>

                    <div class="components-title">
                        <Icon icon="ep:collection" class="components-title__icon" />
                        <span class="components-title__text">选择型组件</span>
                    </div>
                    <VueDraggable
                        class="components-draggable"
                        v-model="selectComponents"
                        :group="{ name: 'componentsGroup', pull: 'clone', put: false }"
                        :sort="false"
                        :animation="200"
                    >
                        <template #default>
                            <div
                                v-for="(element, index) in selectComponents"
                                :key="element.tag + '-' + index"
                                class="components-item"
                                @click="addComponent(element)"
                            >
                                <div class="components-body">
                                    <Icon :icon="iconMap[element.tagIcon]" class="svg-icon" />
                                    {{ element.label }}
                                </div>
                            </div>
                        </template>
                    </VueDraggable>

                    <div class="components-title">
                        <Icon icon="ep:grid" class="components-title__icon" />
                        <span class="components-title__text">布局型组件</span>
                    </div>
                    <VueDraggable
                        class="components-draggable"
                        v-model="layoutComponents"
                        :group="{ name: 'componentsGroup', pull: 'clone', put: false }"
                        :sort="false"
                        :animation="200"
                    >
                        <template #default>
                            <div
                                v-for="(element, index) in layoutComponents"
                                :key="element.tag + '-' + index"
                                class="components-item"
                                @click="addComponent(element)"
                            >
                                <div class="components-body">
                                    <Icon :icon="iconMap[element.tagIcon]" class="svg-icon" />
                                    {{ element.label }}
                                </div>
                            </div>
                        </template>
                    </VueDraggable>
                </div>
            </el-scrollbar>
        </div>

        <div class="center-board">
            <div class="action-bar">
                <el-button type="primary" text @click="download">
                    <el-icon>
                        <Icon icon="ep:download" />
                    </el-icon>
                    导出vue文件
                </el-button>
                <el-button class="copy-btn-main" type="primary" text @click="copy">
                    <el-icon>
                        <Icon icon="ep:document-copy" />
                    </el-icon>
                    复制代码
                </el-button>
                <el-button class="delete-btn" text @click="empty" type="danger">
                    <el-icon>
                        <Icon icon="ep:delete" />
                    </el-icon>
                    清空
                </el-button>
            </div>

            <el-scrollbar class="center-scrollbar">
                <el-row class="center-board-row" :gutter="formConf.gutter">
                    <el-form
                        :size="formConf.size"
                        :label-position="formConf.labelPosition"
                        :disabled="formConf.disabled"
                        :label-width="formConf.labelWidth + 'px'"
                    >
                        <VueDraggable class="drawing-board" v-model="drawingList" item-key="formId" group="componentsGroup" :animation="340" @add="onCenterAdd">
                            <template #default>
                                <draggable-item
                                    v-for="(element, index) in drawingList"
                                    :key="element.renderKey"
                                    :drawing-list="drawingList"
                                    :element="element"
                                    :index="index"
                                    :active-id="activeId"
                                    :form-conf="formConf"
                                    @activeItem="activeFormItem"
                                    @copyItem="drawingItemCopy"
                                    @deleteItem="drawingItemDelete"
                                />
                            </template>
                        </VueDraggable>

                        <div v-show="!drawingList.length" class="empty-info">从左侧拖入或点选组件进行表单设计</div>
                    </el-form>
                </el-row>
            </el-scrollbar>
        </div>

        <right-panel :active-data="activeData" :form-conf="formConf" :show-field="!!drawingList.length" @tag-change="tagChange" />

        <code-type-dialog v-model="dialogVisible" title="选择生成类型" :showFileName="showFileName" @confirm="generate" />
        <input id="copyNode" type="hidden" />
    </div>
</template>

<script setup>
import { ref, getCurrentInstance, nextTick, onMounted, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import ClipboardJS from 'clipboard'
import beautifier from 'js-beautify'
import logo from '@/assets/logo/logo.png'
import { inputComponents, selectComponents, layoutComponents, formConf as formConfData } from '@/utils/generator/config'
import { beautifierConf } from '@/utils/index'
import drawingDefalut from '@/utils/generator/drawingDefalut'
import { makeUpHtml, vueTemplate, vueScript, cssStyle } from '@/utils/generator/html'
import { makeUpJs } from '@/utils/generator/js'
import { makeUpCss } from '@/utils/generator/css'
import Download from '@/plugins/download'
import { ElNotification } from 'element-plus'
import DraggableItem from './DraggableItem'
import RightPanel from './RightPanel'
import CodeTypeDialog from './CodeTypeDialog'
import { Icon } from '@iconify/vue'
import { iconMap } from '@/utils/generator/iconMap'

const drawingList = ref(drawingDefalut)
const { proxy } = getCurrentInstance()
const dialogVisible = ref(false)
const showFileName = ref(false)
const operationType = ref('')
const idGlobal = ref(100)
const activeData = ref(drawingDefalut[0])
const activeId = ref(drawingDefalut[0].formId)
const generateConf = ref(null)
const formData = ref({})
const formConf = ref(formConfData)
let oldActiveId
let tempActiveData

function activeFormItem(element) {
    activeData.value = element
    activeId.value = element.formId
}

function copy() {
    dialogVisible.value = true
    showFileName.value = false
    operationType.value = 'copy'
}

function download() {
    dialogVisible.value = true
    showFileName.value = true
    operationType.value = 'download'
}

function empty() {
    proxy.$modal.confirm('确定要清空所有组件吗？', '提示', { type: 'warning' }).then(() => {
        idGlobal.value = 100
        drawingList.value = []
    })
}

function onCenterAdd(evt) {
    const newIndex = evt.newIndex
    const raw = drawingList.value[newIndex]
    const clone = cloneComponent(raw)
    drawingList.value.splice(newIndex, 1, clone)
    activeFormItem(clone)
}

function addComponent(item) {
    const clone = cloneComponent(item)
    drawingList.value.push(clone)
    activeFormItem(clone)
}

function cloneComponent(origin) {
    const clone = JSON.parse(JSON.stringify(origin))
    clone.formId = ++idGlobal.value
    clone.span = formConf.value.span
    clone.renderKey = +new Date()

    if (!clone.layout) clone.layout = 'colFormItem'

    if (clone.layout === 'colFormItem') {
        clone.vModel = `field${idGlobal.value}`
        if (clone.placeholder !== undefined) {
            clone.placeholder += clone.label
        }
        tempActiveData = clone
    } else if (clone.layout === 'rowFormItem') {
        delete clone.label
        clone.componentName = `row${idGlobal.value}`
        clone.gutter = formConf.value.gutter
        tempActiveData = clone
    }

    return tempActiveData
}

function drawingItemCopy(item, parent) {
    let clone = JSON.parse(JSON.stringify(item))
    clone = createIdAndKey(clone)
    parent.push(clone)
    activeFormItem(clone)
}

function createIdAndKey(item) {
    item.formId = ++idGlobal.value
    item.renderKey = +new Date()

    if (item.layout === 'colFormItem') {
        item.vModel = `field${idGlobal.value}`
    } else if (item.layout === 'rowFormItem') {
        item.componentName = `row${idGlobal.value}`
    }

    if (Array.isArray(item.children)) {
        item.children = item.children.map(childItem => createIdAndKey(childItem))
    }

    return item
}

function drawingItemDelete(index, parent) {
    parent.splice(index, 1)
    nextTick(() => {
        const len = drawingList.value.length
        if (len) {
            activeFormItem(drawingList.value[len - 1])
        }
    })
}

function tagChange(newTag) {
    newTag = cloneComponent(newTag)
    newTag.vModel = activeData.value.vModel
    newTag.formId = activeId.value
    newTag.span = activeData.value.span
    delete activeData.value.tag
    delete activeData.value.tagIcon
    delete activeData.value.document
    Object.keys(newTag).forEach(key => {
        if (activeData.value[key] !== undefined && typeof activeData.value[key] === typeof newTag[key]) {
            newTag[key] = activeData.value[key]
        }
    })
    activeData.value = newTag
    updateDrawingList(newTag, drawingList.value)
}

function updateDrawingList(newTag, list) {
    const index = list.findIndex(item => item.formId === activeId.value)
    if (index > -1) {
        list.splice(index, 1, newTag)
    } else {
        list.forEach(item => {
            if (Array.isArray(item.children)) {
                updateDrawingList(newTag, item.children)
            }
        })
    }
}

function generate(data) {
    generateConf.value = data
    nextTick(() => {
        switch (operationType.value) {
            case 'copy':
                execCopy(data)
                break
            case 'download':
                execDownload(data)
                break
            default:
                break
        }
    })
}

function execDownload(data) {
    const codeStr = generateCode()
    const blob = new Blob([codeStr], { type: 'text/plain;charset=utf-8' })
    Download.saveAs(blob, data.fileName)
}

function execCopy() {
    document.getElementById('copyNode').click()
}

function AssembleFormData() {
    formData.value = {
        fields: JSON.parse(JSON.stringify(drawingList.value)),
        ...formConf.value
    }
}

function generateCode() {
    const { type } = generateConf.value
    AssembleFormData()
    const script = vueScript(makeUpJs(formData.value, type))
    const html = vueTemplate(makeUpHtml(formData.value, type))
    const css = cssStyle(makeUpCss(formData.value))
    return beautifier.html(html + script + css, beautifierConf.html)
}

watch(
    () => activeData.value.label,
    (val, oldVal) => {
        if (activeData.value.placeholder === undefined || !activeData.value.tag || oldActiveId !== activeId.value) {
            return
        }
        activeData.value.placeholder = activeData.value.placeholder.replace(oldVal, '') + val
    }
)

watch(
    activeId,
    val => {
        oldActiveId = val
    },
    { immediate: true }
)

onMounted(() => {
    const clipboard = new ClipboardJS('#copyNode', {
        text: () => {
            const codeStr = generateCode()
            ElNotification({
                title: '成功',
                message: '代码已复制到剪切板，可粘贴。',
                type: 'success'
            })
            return codeStr
        }
    })

    clipboard.on('error', () => {
        proxy.$modal.msgError('代码复制失败')
    })
})
</script>

<style lang="scss">
$lighterBlue: #409eff;

.container {
    position: relative;
    width: 100%;
    background-color: var(--el-bg-color-overlay);
    height: calc(100vh - 50px - 40px);
    overflow: hidden;

    .left-board {
        width: 260px;
        position: absolute;
        left: 0;
        top: 0;
        height: calc(100vh - 50px - 40px);

        .logo-wrapper {
            position: relative;
            height: 42px;
            border-bottom: 1px solid var(--el-border-color-extra-light);
            box-sizing: border-box;

            .logo {
                position: absolute;
                left: 12px;
                top: 6px;
                line-height: 30px;
                color: #00afff;
                font-weight: 600;
                font-size: 17px;
                white-space: nowrap;

                > img {
                    width: 30px;
                    height: 30px;
                    vertical-align: top;
                }

                .github {
                    display: inline-block;
                    vertical-align: sub;
                    margin-left: 15px;

                    > img {
                        height: 22px;
                    }
                }
            }
        }

        .left-scrollbar {
            .el-scrollbar__wrap {
                box-sizing: border-box;
                overflow-x: hidden !important;
                margin-bottom: 0 !important;

                .components-list {
                    padding: 8px;
                    box-sizing: border-box;
                    height: 100%;

                    .components-title {
                        display: flex;
                        align-items: center;
                        gap: 6px; // 图标和文字间距
                        font-size: 14px;
                        margin: 6px 2px;
                        color: var(--el-text-color-primary);

                        &__icon {
                            width: 18px;
                            height: 18px;
                            flex-shrink: 0;
                            color: var(--el-text-color-secondary);
                        }

                        &__text {
                            line-height: 1;
                        }
                    }

                    .components-draggable {
                        padding-bottom: 20px;

                        .components-item {
                            display: inline-block;
                            width: 48%;
                            margin: 1%;
                            transition: transform 0ms !important;

                            .components-body {
                                padding: 8px 10px;
                                background: var(--el-border-color-extra-light);
                                font-size: 12px;
                                cursor: move;
                                border: 1px dashed var(--el-border-color-extra-light);
                                border-radius: 3px;

                                .svg-icon {
                                    font-size: 15px;
                                    margin-right: 5px;
                                }

                                &:hover {
                                    border: 1px dashed #787be8;
                                    color: #787be8;

                                    .svg-icon {
                                        color: #787be8;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    .center-board {
        height: calc(100vh - 50px - 40px);
        width: auto;
        margin: 0 350px 0 260px;
        box-sizing: border-box;

        .action-bar {
            position: relative;
            height: 42px;
            padding: 0 15px;
            box-sizing: border-box;
            border: 1px solid var(--el-border-color-extra-light);
            border-top: none;
            border-left: none;
            display: flex;
            align-items: center;
            justify-content: flex-end;

            u .delete-btn {
                color: #f56c6c;
            }
        }

        .center-scrollbar {
            height: calc(100vh - 50px - 40px - 42px);
            overflow: hidden;
            border-left: 1px solid var(--el-border-color-extra-light);
            border-right: 1px solid var(--el-border-color-extra-light);
            box-sizing: border-box;

            .el-scrollbar__view {
                overflow-x: hidden;
            }

            .center-board-row {
                padding: 12px 12px 15px 12px;
                box-sizing: border-box;

                & > .el-form {
                    // 69 = 12+15+42
                    height: calc(100vh - 50px - 40px - 69px);
                    flex: 1;

                    .drawing-board {
                        height: 100%;
                        position: relative;

                        .components-body {
                            padding: 0;
                            margin: 0;
                            font-size: 0;
                        }

                        .sortable-ghost {
                            position: relative;
                            display: block;
                            overflow: hidden;

                            &::before {
                                content: ' ';
                                position: absolute;
                                left: 0;
                                right: 0;
                                top: 0;
                                height: 3px;
                                background: rgb(89, 89, 223);
                                z-index: 2;
                            }
                        }

                        .components-item.sortable-ghost {
                            width: 100%;
                            height: 60px;
                            background: var(--el-border-color-extra-light);
                        }

                        .active-from-item {
                            & > .el-form-item {
                                background: var(--el-border-color-extra-light);
                                border-radius: 6px;
                            }

                            & > .drawing-item-copy,
                            & > .drawing-item-delete {
                                display: initial;
                            }

                            & > .component-name {
                                color: $lighterBlue;
                            }

                            .el-input__wrapper {
                                box-shadow: 0 0 0 1px var(--el-input-hover-border-color) inset;
                            }
                        }

                        .el-form-item {
                            margin-bottom: 15px;
                        }
                    }

                    .drawing-item {
                        position: relative;
                        cursor: move;

                        &.unfocus-bordered:not(.activeFromItem) > div:first-child {
                            border: 1px dashed #ccc;
                        }

                        .el-form-item {
                            padding: 12px 10px;
                        }
                    }

                    .drawing-row-item {
                        position: relative;
                        cursor: move;
                        box-sizing: border-box;
                        border: 1px dashed #ccc;
                        border-radius: 3px;
                        padding: 0 2px;
                        margin-bottom: 15px;

                        .drawing-row-item {
                            margin-bottom: 2px;
                        }

                        .el-col {
                            margin-top: 22px;
                        }

                        .el-form-item {
                            margin-bottom: 0;
                        }

                        .drag-wrapper {
                            min-height: 80px;
                            flex: 1;
                            display: flex;
                            flex-wrap: wrap;
                        }

                        &.active-from-item {
                            border: 1px dashed $lighterBlue;
                        }

                        .component-name {
                            position: absolute;
                            top: 0;
                            left: 0;
                            font-size: 12px;
                            color: #bbb;
                            display: inline-block;
                            padding: 0 6px;
                        }
                    }

                    .drawing-item,
                    .drawing-row-item {
                        &:hover {
                            & > .el-form-item {
                                background: var(--el-border-color-extra-light);
                                border-radius: 6px;
                            }

                            & > .drawing-item-copy,
                            & > .drawing-item-delete {
                                display: initial;
                            }
                        }

                        & > .drawing-item-copy,
                        & > .drawing-item-delete {
                            display: none;
                            position: absolute;
                            top: -10px;
                            width: 22px;
                            height: 22px;
                            line-height: 22px;
                            text-align: center;
                            border-radius: 50%;
                            font-size: 12px;
                            border: 1px solid;
                            cursor: pointer;
                            z-index: 1;
                        }

                        & > .drawing-item-copy {
                            right: 56px;
                            border-color: $lighterBlue;
                            color: $lighterBlue;
                            background: #fff;

                            &:hover {
                                background: $lighterBlue;
                                color: #fff;
                            }
                        }

                        & > .drawing-item-delete {
                            right: 24px;
                            border-color: #f56c6c;
                            color: #f56c6c;
                            background: #fff;

                            &:hover {
                                background: #f56c6c;
                                color: #fff;
                            }
                        }
                    }

                    .empty-info {
                        position: absolute;
                        top: 46%;
                        left: 0;
                        right: 0;
                        text-align: center;
                        font-size: 18px;
                        color: #ccb1ea;
                        letter-spacing: 4px;
                    }
                }
            }
        }
    }
}
</style>
