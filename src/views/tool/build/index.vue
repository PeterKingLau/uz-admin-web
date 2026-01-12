<template>
    <div class="app-container form-designer-container">
        <div class="left-board">
            <div class="logo-wrapper">
                <div class="logo">
                    <img :src="logo" alt="logo" />
                    <span>可视化表单设计器</span>
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
                                    <span class="components-text">{{ element.label }}</span>
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
                                    <span class="components-text">{{ element.label }}</span>
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
                                    <span class="components-text">{{ element.label }}</span>
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
                    <Icon icon="ep:download" class="mr-1" />
                    导出vue文件
                </el-button>
                <el-button class="copy-btn-main" type="primary" text @click="copy">
                    <Icon icon="ep:document-copy" class="mr-1" />
                    复制代码
                </el-button>
                <el-button class="delete-btn" text @click="empty" type="danger">
                    <Icon icon="ep:delete" class="mr-1" />
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
                        class="drawing-board-wrapper"
                    >
                        <VueDraggable
                            class="drawing-board"
                            v-model="drawingList"
                            item-key="formId"
                            group="componentsGroup"
                            :animation="340"
                            @add="onCenterAdd"
                            ghost-class="ghost"
                        >
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

                        <div v-show="!drawingList.length" class="empty-info">
                            <Icon icon="ep:plus" class="empty-icon" />
                            <div>从左侧拖入或点选组件进行表单设计</div>
                        </div>
                    </el-form>
                </el-row>
            </el-scrollbar>
        </div>

        <div class="right-board">
            <right-panel :active-data="activeData" :form-conf="formConf" :show-field="!!drawingList.length" @tag-change="tagChange" />
        </div>

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

.form-designer-container.app-container {
    padding: 0 !important;
    width: 100%;
    height: calc(100vh - 84px);
    background-color: var(--el-bg-color-overlay);
    overflow: hidden;
    display: flex;
    flex-direction: row;

    .left-board {
        width: 260px;
        height: 100%;
        flex-shrink: 0;
        border-right: 1px solid var(--el-border-color-extra-light);
        display: flex;
        flex-direction: column;
        background: var(--el-bg-color);

        .logo-wrapper {
            position: relative;
            height: 42px;
            border-bottom: 1px solid var(--el-border-color-extra-light);
            box-sizing: border-box;

            .logo {
                display: flex;
                align-items: center;
                padding-left: 12px;
                height: 100%;
                color: var(--el-color-primary);
                font-weight: 600;
                font-size: 17px;
                white-space: nowrap;

                > img {
                    width: 30px;
                    height: 30px;
                    margin-right: 8px;
                }
            }
        }

        .left-scrollbar {
            flex: 1;
            .el-scrollbar__wrap {
                overflow-x: hidden !important;
                margin-bottom: 0 !important;

                .components-list {
                    padding: 8px;
                    box-sizing: border-box;

                    .components-title {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 14px;
                        margin: 14px 2px 8px;
                        color: var(--el-text-color-primary);

                        &:first-child {
                            margin-top: 0;
                        }

                        &__icon {
                            font-size: 16px;
                            color: var(--el-text-color-secondary);
                        }
                        &__text {
                            font-weight: 600;
                        }
                    }

                    .components-draggable {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 8px;
                        padding-bottom: 8px;

                        .components-item {
                            width: 100%;
                            cursor: move;
                            border: 1px dashed var(--el-border-color-light);
                            border-radius: 4px;
                            transition: all 0.2s;
                            background: var(--el-fill-color-light);

                            .components-body {
                                padding: 8px 6px;
                                font-size: 12px;
                                display: flex;
                                align-items: center;
                                justify-content: center;

                                .svg-icon {
                                    font-size: 16px;
                                    margin-right: 6px;
                                    flex-shrink: 0;
                                }

                                .components-text {
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    white-space: nowrap;
                                    color: var(--el-text-color-regular);
                                }
                            }

                            &:hover {
                                border-color: var(--el-color-primary);
                                color: var(--el-color-primary);
                                background-color: var(--el-color-primary-light-9);
                                .svg-icon {
                                    color: var(--el-color-primary);
                                }
                                .components-text {
                                    color: var(--el-color-primary);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    .center-board {
        flex: 1;
        height: 100%;
        display: flex;
        flex-direction: column;
        border-left: 1px solid var(--el-border-color-light);
        border-right: 1px solid var(--el-border-color-light);
        background-color: var(--el-bg-color-page);

        .action-bar {
            height: 42px;
            padding: 0 15px;
            box-sizing: border-box;
            border-bottom: 1px solid var(--el-border-color-light);
            background: var(--el-bg-color);
            display: flex;
            align-items: center;
            justify-content: flex-end;

            .delete-btn {
                color: var(--el-color-danger);
            }
        }

        .center-scrollbar {
            flex: 1;
            box-sizing: border-box;

            .el-scrollbar__view {
                height: 100%;
            }

            .center-board-row {
                padding: 12px;
                box-sizing: border-box;
                height: 100%;
                display: flex;

                .drawing-board-wrapper {
                    flex: 1;
                    height: 100%;
                    position: relative;
                }

                .drawing-board {
                    height: 100%;
                    min-height: 500px;
                    position: relative;
                    background: var(--el-bg-color);
                    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
                    border-radius: 4px;
                    padding: 10px;

                    .components-body {
                        padding: 0;
                        margin: 0;
                        font-size: 0;
                    }

                    .active-from-item {
                        & > .el-form-item {
                            background: var(--el-fill-color-light);
                            border-radius: 6px;
                            outline: 1px dashed var(--el-color-primary);
                        }
                        & > .drawing-item-copy,
                        & > .drawing-item-delete {
                            display: block;
                        }
                        & > .component-name {
                            color: var(--el-color-primary);
                        }
                    }

                    .el-form-item {
                        margin-bottom: 15px;
                    }
                }

                .ghost {
                    position: relative;
                    display: block;
                    overflow: hidden;
                    height: 60px;
                    background: var(--el-color-primary-light-9);
                    border: 2px dashed var(--el-color-primary);
                    &::before {
                        content: ' ';
                        position: absolute;
                        left: 0;
                        right: 0;
                        top: 0;
                        height: 3px;
                        background: var(--el-color-primary);
                        z-index: 2;
                    }
                }

                .drawing-item,
                .drawing-row-item {
                    position: relative;
                    cursor: move;

                    &:hover {
                        & > .el-form-item {
                            background: var(--el-fill-color-lighter);
                            border-radius: 6px;
                        }
                        & > .drawing-item-copy,
                        & > .drawing-item-delete {
                            display: block;
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
                        z-index: 10;
                    }

                    & > .drawing-item-copy {
                        right: 56px;
                        border-color: var(--el-color-primary);
                        color: var(--el-color-primary);
                        background: var(--el-bg-color);
                        &:hover {
                            background: var(--el-color-primary);
                            color: #fff;
                        }
                    }

                    & > .drawing-item-delete {
                        right: 24px;
                        border-color: var(--el-color-danger);
                        color: var(--el-color-danger);
                        background: var(--el-bg-color);
                        &:hover {
                            background: var(--el-color-danger);
                            color: #fff;
                        }
                    }
                }

                .drawing-row-item {
                    border: 1px dashed var(--el-border-color);
                    border-radius: 3px;
                    padding: 10px 5px;
                    margin-bottom: 15px;

                    .drag-wrapper {
                        min-height: 80px;
                        border: 1px dashed var(--el-border-color-lighter);
                        background: var(--el-fill-color-extra-light);
                    }

                    &.active-from-item {
                        border: 1px dashed var(--el-color-primary);
                    }

                    .component-name {
                        position: absolute;
                        top: 0;
                        left: 0;
                        font-size: 12px;
                        color: var(--el-text-color-placeholder);
                        padding: 0 6px;
                        background: var(--el-bg-color);
                    }
                }

                .empty-info {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    color: var(--el-text-color-secondary);
                    pointer-events: none;
                    width: 100%;

                    .empty-icon {
                        font-size: 50px;
                        color: var(--el-text-color-placeholder);
                        margin-bottom: 16px;
                    }
                }
            }
        }
    }

    .right-board {
        width: 350px;
        height: 100%;
        flex-shrink: 0;
        border-left: 1px solid var(--el-border-color-extra-light);
        background-color: var(--el-bg-color);
    }
}
</style>
