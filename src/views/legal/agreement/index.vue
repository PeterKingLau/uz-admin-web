<template>
    <WebLegalLayout
        type-label="用户协议"
        :title="legalContent.agreement.title"
        active-path="/user-agreement"
        :summary="legalContent.agreement.summary"
        :metas="legalContent.agreement.metas"
        :sections="legalContent.agreement.sections"
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

defineOptions({ name: 'ViewsLegalAgreement' })

const { locale } = useRouteLocale()
const legalContent = computed(() => getLegalContent(locale.value))
const localizedContact = computed(() => getLocalizedContact(locale.value))

watch(
    () => legalContent.value.agreement.documentTitle,
    title => {
        document.title = title
    },
    { immediate: true }
)
</script>
