<template>
    <div class="hamburger-container" @click="toggleClick">
        <Icon :icon="hamburgerIcon" class="hamburger" />
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    isActive: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['toggleClick'])

const toggleClick = () => {
    emit('toggleClick')
}

const hamburgerIcon = computed(() => (props.isActive ? 'ep:fold' : 'ep:expand'))
</script>

<style lang="scss" scoped>
.hamburger-container {
    padding: 0 15px;
    height: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
        background: rgba(0, 0, 0, 0.025);

        .hamburger {
            color: var(--el-color-primary);
        }
    }

    .hamburger {
        font-size: 20px;
        color: var(--el-text-color-regular);
        transition: color 0.3s;
    }
}
</style>
