<template>
    <div></div>
</template>

<script setup>
defineOptions({ name: 'ViewsRedirect' })
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

function normalizeRedirectPath(rawPath) {
    const value = Array.isArray(rawPath) ? rawPath.join('/') : String(rawPath || '').trim()
    if (!value) return '/'
    try {
        const decoded = decodeURIComponent(value)
        return decoded.startsWith('/') ? decoded : `/${decoded}`
    } catch {
        return value.startsWith('/') ? value : `/${value}`
    }
}

async function doRedirect() {
    const targetPath = normalizeRedirectPath(route.params.path)
    try {
        await router.replace({ path: targetPath, query: route.query })
    } catch {
        await router.replace('/')
    }
}

doRedirect()
</script>
