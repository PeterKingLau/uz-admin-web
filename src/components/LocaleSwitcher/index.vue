<template>
    <div ref="switcherRef" class="locale-switcher" :class="{ 'is-compact': compact, 'is-open': open }">
        <button type="button" class="locale-trigger" :aria-expanded="open" aria-label="切换语言 / Switch language" @click="toggleOpen">
            <Icon icon="mdi:translate" class="locale-icon" aria-hidden="true" />
            <span>{{ compact ? activeOption.shortLabel : activeOption.label }}</span>
            <Icon icon="mdi:chevron-down" class="locale-arrow" aria-hidden="true" />
        </button>

        <Transition name="locale-menu">
            <div v-if="open" class="locale-menu" role="listbox">
                <button
                    v-for="item in localeOptions"
                    :key="item.value"
                    type="button"
                    class="locale-option"
                    :class="{ active: item.value === currentLocale }"
                    role="option"
                    :aria-selected="item.value === currentLocale"
                    @click="selectLocale(item.value)"
                >
                    <span>{{ item.label }}</span>
                    <Icon v-if="item.value === currentLocale" icon="mdi:check" aria-hidden="true" />
                </button>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { localeLabels, normalizeLocale, SUPPORT_LOCALES, type SupportLocale } from '@/locales'

defineOptions({ name: 'LocaleSwitcher' })

defineProps<{
    compact?: boolean
}>()

const route = useRoute()
const router = useRouter()
const { locale } = useI18n({ useScope: 'global' })
const open = ref(false)
const switcherRef = ref<HTMLElement | null>(null)
const localeOptions = SUPPORT_LOCALES.map(value => ({ value, ...localeLabels[value] }))
const currentLocale = computed(() => normalizeLocale(String(locale.value)))
const activeOption = computed(() => localeOptions.find(item => item.value === currentLocale.value) || localeOptions[0])

function toggleOpen() {
    open.value = !open.value
}

function selectLocale(value: SupportLocale) {
    locale.value = value
    open.value = false
    void router.replace({ path: route.path, query: { ...route.query, lang: value }, hash: route.hash })
}

function syncLocale(value: unknown) {
    const queryLocale = Array.isArray(value) ? value[0] : value
    locale.value = normalizeLocale(typeof queryLocale === 'string' ? queryLocale : window.navigator.language)
}

function handleDocumentClick(event: MouseEvent) {
    if (!switcherRef.value?.contains(event.target as Node)) {
        open.value = false
    }
}

function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        open.value = false
    }
}

watch(() => route.query.lang, syncLocale)

onMounted(() => {
    syncLocale(route.query.lang)
    document.addEventListener('click', handleDocumentClick)
    window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleDocumentClick)
    window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
.locale-switcher {
    position: relative;
    display: inline-flex;
    flex: 0 0 auto;
}

.locale-trigger {
    height: 34px;
    min-width: 132px;
    padding: 0 10px;
    border: 1px solid #dbe4f0;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.92);
    color: #475569;
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    transition:
        border-color 160ms ease,
        background-color 160ms ease,
        color 160ms ease,
        box-shadow 160ms ease;
}

.is-compact .locale-trigger {
    min-width: 86px;
    height: 32px;
    padding: 0 9px;
}

.locale-trigger:hover,
.is-open .locale-trigger {
    border-color: #93c5fd;
    background: #ffffff;
    color: #2563eb;
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.08);
}

.locale-icon,
.locale-arrow {
    width: 15px;
    height: 15px;
    flex: 0 0 auto;
}

.locale-arrow {
    transition: transform 160ms ease;
}

.is-open .locale-arrow {
    transform: rotate(180deg);
}

.locale-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 1000;
    width: 136px;
    padding: 6px;
    border: 1px solid #dbe4f0;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.14);
}

.locale-option {
    width: 100%;
    height: 34px;
    padding: 0 8px;
    border: 0;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    background: transparent;
    color: #475569;
    font-size: 13px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
}

.locale-option:hover {
    background: #f1f5f9;
    color: #0f172a;
}

.locale-option.active {
    background: #eff6ff;
    color: #2563eb;
    font-weight: 700;
}

.locale-option svg {
    width: 15px;
    height: 15px;
}

.locale-menu-enter-active,
.locale-menu-leave-active {
    transition:
        opacity 140ms ease,
        transform 140ms ease;
}

.locale-menu-enter-from,
.locale-menu-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
