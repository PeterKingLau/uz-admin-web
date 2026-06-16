<template>
    <footer id="contact" class="portal-footer">
        <div class="footer-brand">
            <div class="brand-row">
                <img :src="brandLogo" alt="" />
                <strong>{{ ui.brandName }}</strong>
            </div>
            <p>{{ ui.intro }}</p>
        </div>
        <div v-for="group in footerGroups" :key="group.title" class="footer-group">
            <h3>{{ group.title }}</h3>
            <a v-for="item in group.items.filter(entry => entry.href)" :key="item.label" :href="item.href" :class="{ 'with-icon': item.icon }" @click.prevent="$emit('navigate', item.href || '')">
                <Icon v-if="item.icon" :icon="item.icon" />
                <span>{{ item.label }}</span>
            </a>
            <span v-for="item in group.items.filter(entry => !entry.href)" :key="item.label" class="footer-text" :class="{ 'with-icon': item.icon }">
                <Icon v-if="item.icon" :icon="item.icon" />
                <span>{{ item.label }}</span>
            </span>
        </div>
        <div class="footer-bottom">
            <span>{{ ui.copyright }}</span>
            <a :href="beianRecordUrl" target="_blank" rel="noopener noreferrer" @click.prevent="handleBeianLinkClick">{{ ui.icpText }}</a>
        </div>

        <teleport to="body">
            <el-dialog v-model="beianDialogVisible" title="备案查询" width="360px" align-center class="portal-beian-dialog" @opened="selectBeianRecordNumber">
                <div class="portal-beian-dialog-content">
                    <p>备案号已为您选中，可直接复制后前往备案查询页。</p>
                    <input
                        ref="beianRecordInputRef"
                        class="portal-beian-record-input"
                        type="text"
                        :value="ui.icpText"
                        readonly
                        @focus="selectBeianRecordNumber"
                        @click="selectBeianRecordNumber"
                    />
                </div>
                <template #footer>
                    <el-button @click="beianDialogVisible = false">关闭</el-button>
                    <el-button type="primary" @click="openBeianRecordQuery">打开查询页</el-button>
                </template>
            </el-dialog>
        </teleport>
    </footer>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { copyTextToClipboard } from '@/directive/common/copyText'
import type { PortalFooterGroup, PortalUiText } from '../data'

defineOptions({ name: 'PortalFooter' })
const props = defineProps<{
    ui: PortalUiText['footer']
    brandLogo: string
    footerGroups: PortalFooterGroup[]
}>()
defineEmits<{
    navigate: [route: string]
}>()

const beianRecordUrl = 'https://beian.miit.gov.cn/#/Integrated/recordQuery'
const beianDialogVisible = ref(false)
const beianRecordInputRef = ref<HTMLInputElement | null>(null)
const BEIAN_REDIRECT_DELAY_MS = 320

function handleBeianLinkClick() {
    if (copyTextToClipboard(props.ui.icpText)) {
        ElMessage.success('备案号已复制')
        window.setTimeout(openBeianRecordQuery, BEIAN_REDIRECT_DELAY_MS)
        return
    }
    beianDialogVisible.value = true
}

function selectBeianRecordNumber() {
    nextTick(() => {
        beianRecordInputRef.value?.focus()
        beianRecordInputRef.value?.select()
    })
}

function openBeianRecordQuery() {
    window.open(beianRecordUrl, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped lang="scss">
:global(.portal-beian-dialog) {
    border-radius: 12px;

    .el-dialog__header {
        margin-right: 0;
        padding-bottom: 8px;
    }

    .el-dialog__body {
        padding-top: 8px;
    }
}

.portal-beian-dialog-content {
    display: grid;
    gap: 12px;

    p {
        margin: 0;
        color: var(--el-text-color-secondary);
        font-size: 14px;
        line-height: 1.6;
    }
}

.portal-beian-record-input {
    width: 100%;
    height: 40px;
    padding: 0 12px;
    box-sizing: border-box;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
    font-size: 14px;
    outline: none;

    &:focus {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    }
}
</style>
