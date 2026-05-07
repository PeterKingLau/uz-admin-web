<template>
    <div v-loading="loading" :style="'height:' + height">
        <iframe :src="url" frameborder="no" style="width: 100%; height: 100%" scrolling="auto" />
    </div>
</template>

<script setup>
defineOptions({ name: 'ComponentsIFrame' })
const props = defineProps({
    src: {
        type: String,
        required: true
    }
})

const height = ref(document.documentElement.clientHeight - 94.5 + 'px;')
const loading = ref(true)
const url = computed(() => props.src)
let loadingTimer = null

function updateHeight() {
    height.value = document.documentElement.clientHeight - 94.5 + 'px;'
}

onMounted(() => {
    loadingTimer = setTimeout(() => {
        loading.value = false
        loadingTimer = null
    }, 300)
    window.addEventListener('resize', updateHeight)
})

onBeforeUnmount(() => {
    if (loadingTimer) {
        clearTimeout(loadingTimer)
        loadingTimer = null
    }
    window.removeEventListener('resize', updateHeight)
})
</script>
