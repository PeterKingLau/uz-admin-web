<template>
    <WebLegalLayout
        type-label="隐私政策"
        :title="legalContent.privacy.title"
        active-path="/privacy-policy"
        :summary="legalContent.privacy.summary"
        :metas="legalContent.privacy.metas"
        :sections="legalContent.privacy.sections"
        :contact="localizedContact"
        :contact-labels="legalContent.contact"
        :nav-labels="legalContent.nav"
    />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import WebLegalLayout from '../components/WebLegalLayout.vue'
import { getLegalContent, getLocalizedContact } from '../content'
import { useRouteLocale } from '@/locales/useRouteLocale'

defineOptions({ name: 'ViewsLegalPrivacy' })

const { locale } = useRouteLocale()
const legalContent = computed(() => getLegalContent(locale.value))
const localizedContact = computed(() => getLocalizedContact(locale.value))

watch(
    () => legalContent.value.privacy.documentTitle,
    title => {
        document.title = title
    },
    { immediate: true }
)
</script>
