<template>
    <div class="inline-flex items-center justify-center shrink-0">
        <el-tag v-if="deleted" type="danger" size="small" class="rounded-full px-3">内容已删除</el-tag>

        <el-image
            v-else-if="finalSrc && !imageError"
            :src="finalSrc"
            :style="dynamicSize"
            class="rounded-full object-cover cursor-pointer border border-gray-200"
            fit="cover"
            :preview-src-list="previewList"
            :preview-teleported="true"
            @error="onImageError"
        />

        <template v-if="imageError && finalSrc">
            <div :style="dynamicSize" class="rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Icon icon="mdi:account-off" class="text-xl" />
            </div>
        </template>

        <span v-if="!finalSrc" class="text-gray-400 text-xs">无</span>
    </div>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue'

const props = defineProps({
    src: {
        type: String,
        default: ''
    },
    size: {
        type: Number,
        default: 40
    },
    deleted: {
        type: Boolean,
        default: false
    }
})

const { proxy } = getCurrentInstance() || {}

const imageError = ref(false)

const finalSrc = computed(() => {
    if (!props.src) return ''
    return proxy?.$imgUrl ? proxy.$imgUrl(props.src) : props.src
})

const previewList = computed(() => {
    return finalSrc.value ? [finalSrc.value] : []
})

const dynamicSize = computed(() => ({
    width: `${props.size}px`,
    height: `${props.size}px`
}))

function onImageError() {
    imageError.value = true
}
</script>
