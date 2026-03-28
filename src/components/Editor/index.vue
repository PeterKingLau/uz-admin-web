<template>
    <div class="modern-md-wrapper">
        <MdEditor
            v-model="markdownContent"
            :class="['editor-container', { 'is-textarea-mode': isTextareaMode }]"
            :style="editorStyles"
            :theme="editorTheme"
            :placeholder="placeholder"
            :read-only="props.readOnly"
            :preview="false"
            :html-preview="false"
            :show-toolbar-name="false"
            :footers="footers"
            :toolbars="toolbars"
            :no-upload-img="props.type !== 'url'"
            :on-upload-img="handleUploadImg"
            @onHtmlChanged="handleHtmlChanged"
        />
    </div>
</template>

<script setup>
defineOptions({ name: 'Editor' })
import { computed, ref, watch, getCurrentInstance } from 'vue'
import axios from 'axios'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import useSettingsStore from '@/store/modules/settings'
import { getToken } from '@/utils/auth'
import { getImgUrl } from '@/utils/img'

const { proxy } = getCurrentInstance()
const settingsStore = useSettingsStore()

const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    height: {
        type: Number,
        default: null
    },
    minHeight: {
        type: Number,
        default: null
    },
    readOnly: {
        type: Boolean,
        default: false
    },
    fileSize: {
        type: Number,
        default: 10
    },
    type: {
        type: String,
        default: 'url'
    },
    mode: {
        type: String,
        default: 'default'
    }
})

const emit = defineEmits(['update:modelValue'])

const uploadUrl = `${import.meta.env.VITE_APP_BASE_API}/common/upload`
const markdownContent = ref('')
const lastEmittedHtml = ref('')
const isTextareaMode = computed(() => props.mode === 'textarea')
const editorTheme = computed(() => (settingsStore.isDark ? 'dark' : 'light'))
const placeholder = computed(() => (isTextareaMode.value ? '请输入正文内容...' : '请输入内容'))
const footers = computed(() => (isTextareaMode.value ? [] : ['markdownTotal']))
const toolbars = computed(() =>
    isTextareaMode.value
        ? ['bold', 'underline', 'italic', 'strikeThrough', '-', 'link', 'image', '=', 'revoke', 'next']
        : [
              'bold',
              'underline',
              'italic',
              'strikeThrough',
              '-',
              'title',
              'quote',
              'unorderedList',
              'orderedList',
              '-',
              'link',
              'image',
              'table',
              'code',
              '=',
              'revoke',
              'next',
              'preview'
          ]
)

const editorStyles = computed(() => {
    const style = {}
    if (props.minHeight) {
        style.minHeight = `${props.minHeight}px`
    }
    if (props.height) {
        style.height = `${props.height}px`
    }
    return style
})

watch(
    () => props.modelValue,
    value => {
        const incoming = String(value || '')
        if (incoming === lastEmittedHtml.value) return
        const nextMarkdown = toEditorMarkdown(incoming)
        if (nextMarkdown !== markdownContent.value) {
            markdownContent.value = nextMarkdown
        }
    },
    { immediate: true }
)

function handleHtmlChanged(html) {
    const nextHtml = String(html || '')
    lastEmittedHtml.value = nextHtml
    emit('update:modelValue', nextHtml)
}

async function handleUploadImg(files, callback) {
    const uploadedUrls = []

    for (const file of files) {
        const passed = handleBeforeUpload(file)
        if (!passed) return

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await axios.post(uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${getToken()}`
                }
            })

            const data = res?.data
            if (data?.code !== 200 || !data?.fileName) {
                proxy?.$modal?.msgError?.('图片插入失败')
                return
            }

            uploadedUrls.push(getImgUrl(data.fileName))
        } catch (error) {
            console.error(error)
            proxy?.$modal?.msgError?.('图片插入失败')
            return
        }
    }

    if (uploadedUrls.length) {
        callback(uploadedUrls)
    }
}

function handleBeforeUpload(file) {
    const types = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/svg']
    const isValidType = types.includes(file.type)
    if (!isValidType) {
        proxy?.$modal?.msgError?.('图片格式错误')
        return false
    }

    if (props.fileSize) {
        const isLt = file.size / 1024 / 1024 < props.fileSize
        if (!isLt) {
            proxy?.$modal?.msgError?.(`上传文件大小不能超过 ${props.fileSize} MB`)
            return false
        }
    }

    return true
}

function toEditorMarkdown(value) {
    const source = String(value || '')
    if (!source.trim()) return ''
    if (!looksLikeHtml(source)) return source
    return htmlToMarkdown(source)
}

function looksLikeHtml(value) {
    return /<\/?[a-z][\s\S]*>/i.test(String(value || ''))
}

function htmlToMarkdown(html) {
    if (typeof DOMParser === 'undefined') return html

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const markdown = transformNodes(Array.from(doc.body.childNodes), { inPre: false })
    return normalizeMarkdown(markdown)
}

function transformNodes(nodes, context) {
    return nodes.map(node => transformNode(node, context)).join('')
}

function transformNode(node, context) {
    if (node.nodeType === 3) {
        const text = node.textContent || ''
        return context.inPre ? text : text.replace(/\s+/g, ' ')
    }

    if (node.nodeType !== 1) return ''

    const el = node
    const tag = el.tagName.toLowerCase()
    const inner = transformNodes(Array.from(el.childNodes), context)

    switch (tag) {
        case 'br':
            return '\n'
        case 'p':
        case 'div': {
            const text = trimInline(inner)
            return text ? `${text}\n\n` : ''
        }
        case 'strong':
        case 'b':
            return inner.trim() ? `**${trimInline(inner)}**` : ''
        case 'em':
        case 'i':
            return inner.trim() ? `*${trimInline(inner)}*` : ''
        case 's':
        case 'strike':
        case 'del':
            return inner.trim() ? `~~${trimInline(inner)}~~` : ''
        case 'u':
            return inner.trim() ? `<u>${trimInline(inner)}</u>` : ''
        case 'code':
            if (context.inPre) return el.textContent || ''
            return inner.trim() ? `\`${(el.textContent || '').replace(/`/g, '\\`')}\`` : ''
        case 'pre': {
            const code = transformNodes(Array.from(el.childNodes), { ...context, inPre: true }).replace(/\n+$/, '')
            return code ? `\`\`\`\n${code}\n\`\`\`\n\n` : ''
        }
        case 'blockquote': {
            const text = normalizeMarkdown(inner)
            return text
                ? `${text
                      .split('\n')
                      .map(line => (line ? `> ${line}` : '>'))
                      .join('\n')}\n\n`
                : ''
        }
        case 'a': {
            const href = el.getAttribute('href') || ''
            const text = trimInline(inner) || href
            return href ? `[${text}](${href})` : text
        }
        case 'img': {
            const src = el.getAttribute('src') || ''
            const alt = el.getAttribute('alt') || ''
            return src ? `![${alt}](${src})` : ''
        }
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6': {
            const level = Number(tag.slice(1))
            const text = trimInline(inner)
            return text ? `${'#'.repeat(level)} ${text}\n\n` : ''
        }
        case 'ul':
            return `${transformList(Array.from(el.children), false)}\n\n`
        case 'ol':
            return `${transformList(Array.from(el.children), true)}\n\n`
        case 'li':
            return `${trimInline(inner)}\n`
        case 'hr':
            return '---\n\n'
        default:
            return inner
    }
}

function transformList(items, ordered) {
    return items
        .map((item, index) => {
            const content = normalizeMarkdown(transformNodes(Array.from(item.childNodes), { inPre: false }))
            const padded = content
                .split('\n')
                .filter(line => line.trim().length > 0)
                .map((line, lineIndex) => {
                    if (lineIndex === 0) {
                        return `${ordered ? `${index + 1}.` : '-'} ${line}`
                    }
                    return `   ${line}`
                })
                .join('\n')
            return padded
        })
        .filter(Boolean)
        .join('\n')
}

function trimInline(text) {
    return String(text || '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim()
}

function normalizeMarkdown(text) {
    return String(text || '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}
</script>

<style lang="scss" scoped>
.modern-md-wrapper {
    width: 100%;
}

.editor-container {
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    transition: all 0.24s ease;

    &:focus-within {
        border-color: var(--el-color-primary);
        box-shadow:
            0 0 0 1px var(--el-color-primary) inset,
            0 6px 16px rgba(var(--el-color-primary-rgb), 0.08);
    }

    :deep(.md-editor) {
        --md-color: var(--el-text-color-primary);
        --md-hover-color: var(--el-color-primary);
        --md-bk-color: var(--el-bg-color);
        --md-bk-color-outstand: color-mix(in srgb, var(--el-fill-color-light) 72%, var(--el-color-white));
        --md-bk-hover-color: color-mix(in srgb, var(--el-fill-color-light) 88%, var(--el-color-white));
        --md-border-color: var(--el-border-color-lighter);
        --md-border-hover-color: var(--el-color-primary-light-5);
        --md-border-active-color: var(--el-color-primary);
        --md-scrollbar-bg-color: transparent;
        --md-scrollbar-thumb-color: color-mix(in srgb, var(--el-text-color-placeholder) 36%, transparent);
        --md-scrollbar-thumb-hover-color: color-mix(in srgb, var(--el-color-primary) 45%, transparent);
        background-color: var(--el-bg-color);
        color: var(--el-text-color-primary);
        border: none;
    }

    :deep(.md-editor-toolbar-wrapper) {
        border-bottom: 1px solid var(--el-border-color-lighter);
        background: linear-gradient(180deg, color-mix(in srgb, var(--el-fill-color-light) 78%, var(--el-color-white)) 0%, var(--el-bg-color) 100%);
        padding: 8px 10px;
    }

    :deep(.md-editor-toolbar) {
        gap: 6px;
    }

    :deep(.md-editor-toolbar-left),
    :deep(.md-editor-toolbar-right) {
        gap: 4px;
    }

    :deep(.md-editor-divider) {
        height: 14px;
        margin: 0 4px;
        inset-block-start: 0;
        background-color: color-mix(in srgb, var(--el-border-color) 82%, transparent);
    }

    :deep(.md-editor-toolbar-item) {
        width: 30px;
        height: 30px;
        margin: 0;
        padding: 0;
        color: var(--el-text-color-regular);
        border-radius: 6px;
        flex-shrink: 0;
        transition:
            background-color 0.2s ease,
            color 0.2s ease;
    }

    :deep(.md-editor-toolbar-item svg.md-editor-icon) {
        width: 16px;
        height: 16px;
        padding: 0;
    }

    :deep(.md-editor-toolbar-item:hover),
    :deep(.md-editor-toolbar-active) {
        color: var(--el-color-primary);
        background-color: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
    }

    :deep(.md-editor-input-wrapper) {
        background: linear-gradient(180deg, color-mix(in srgb, var(--el-fill-color-blank) 84%, var(--el-color-white)) 0%, var(--el-bg-color) 100%);
    }

    :deep(.md-editor-input) {
        color: var(--el-text-color-primary);
        font-size: 15px;
        line-height: 1.7;
        padding: 0;
        border: none;
        border-radius: 0;
        background: transparent;
    }

    :deep(.md-editor-input::placeholder) {
        color: var(--el-text-color-placeholder);
    }

    :deep(.cm-editor) {
        font-size: 15px;
        line-height: 1.75;
        background: transparent;
    }

    :deep(.cm-editor.cm-focused) {
        outline: none;
    }

    :deep(.cm-editor .cm-content[contenteditable='true']) {
        margin: 0;
        padding: 18px 20px;
        min-height: 220px;
        caret-color: var(--el-color-primary);
    }

    :deep(.cm-editor .cm-gutters) {
        background: transparent;
        border-right: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 70%, transparent);
    }

    :deep(.md-editor-preview) {
        padding: 16px 20px;
        font-size: 15px;
        line-height: 1.75;
        color: var(--el-text-color-primary);
    }

    :deep(.md-editor-preview p) {
        margin: 0 0 12px;
    }

    :deep(.md-editor-preview blockquote) {
        margin: 16px 0;
        padding: 10px 14px;
        border-left: 4px solid var(--el-color-primary-light-5);
        background: color-mix(in srgb, var(--el-fill-color-light) 86%, transparent);
        color: var(--el-text-color-regular);
        border-radius: 0 10px 10px 0;
    }

    :deep(.md-editor-preview table) {
        width: 100%;
        border-radius: 10px;
        overflow: hidden;
    }

    :deep(.md-editor-resize-operate) {
        background-color: color-mix(in srgb, var(--el-fill-color-light) 90%, var(--el-color-white));
        border-top: 1px solid var(--el-border-color-lighter);
    }

    :deep(.md-editor-footer) {
        min-height: 28px;
        height: 28px;
        justify-content: flex-end;
        background-color: color-mix(in srgb, var(--el-fill-color-light) 90%, var(--el-color-white));
        border-top: 1px solid var(--el-border-color-lighter);
        color: var(--el-text-color-secondary);
        font-size: 12px;
    }

    :deep(.md-editor-footer-item) {
        padding: 0 10px;
    }

    :deep(.md-editor-menu),
    :deep(.md-editor-dropdown) {
        border-radius: 8px;
        border-color: var(--el-border-color-lighter);
        background-color: var(--el-bg-color-overlay);
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
    }

    :deep(.md-editor-menu-item:hover) {
        background-color: var(--el-fill-color-light);
        color: var(--el-color-primary);
    }

    :deep(.md-editor-input-wrapper::-webkit-scrollbar),
    :deep(.md-editor-preview-wrapper::-webkit-scrollbar) {
        width: 8px;
        height: 8px;
    }

    :deep(.md-editor-input-wrapper::-webkit-scrollbar-thumb),
    :deep(.md-editor-preview-wrapper::-webkit-scrollbar-thumb) {
        background-color: color-mix(in srgb, var(--el-text-color-placeholder) 36%, transparent);
        border-radius: 999px;
    }

    &.is-textarea-mode {
        border-radius: 8px;
        box-shadow: none;

        &:focus-within {
            box-shadow:
                0 0 0 1px var(--el-color-primary) inset,
                0 4px 12px rgba(var(--el-color-primary-rgb), 0.06);
        }

        :deep(.md-editor) {
            --md-bk-color-outstand: color-mix(in srgb, var(--el-fill-color-light) 82%, var(--el-color-white));
            --md-bk-hover-color: color-mix(in srgb, var(--el-fill-color-light) 94%, var(--el-color-white));
        }

        :deep(.md-editor-toolbar-wrapper) {
            padding: 6px 8px;
            background: var(--el-bg-color);
            border-bottom: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 86%, transparent);
        }

        :deep(.md-editor-toolbar) {
            gap: 4px;
        }

        :deep(.md-editor-toolbar-left),
        :deep(.md-editor-toolbar-right) {
            gap: 2px;
        }

        :deep(.md-editor-toolbar-item) {
            width: 28px;
            height: 28px;
            border-radius: 6px;
        }

        :deep(.md-editor-toolbar-item svg.md-editor-icon) {
            width: 15px;
            height: 15px;
        }

        :deep(.md-editor-divider) {
            height: 12px;
            margin: 0 2px;
        }

        :deep(.md-editor-input-wrapper) {
            background: var(--el-bg-color);
        }

        :deep(.cm-editor) {
            font-size: 14px;
            line-height: 1.7;
        }

        :deep(.cm-editor .cm-gutters) {
            display: none;
        }

        :deep(.cm-editor .cm-content[contenteditable='true']) {
            padding: 14px 16px;
            min-height: 180px;
        }

        :deep(.md-editor-footer),
        :deep(.md-editor-resize-operate) {
            display: none;
        }
    }
}

:global(html.dark) .modern-md-wrapper {
    .editor-container {
        border-color: var(--el-border-color);
        box-shadow: none;

        &:focus-within {
            box-shadow:
                0 0 0 1px var(--el-color-primary) inset,
                0 10px 22px rgba(0, 0, 0, 0.22);
        }

        :deep(.md-editor) {
            --md-color: color-mix(in srgb, var(--el-color-white) 85%, var(--el-text-color-primary));
            --md-hover-color: var(--el-color-primary-light-3);
            --md-bk-color: var(--el-bg-color-overlay);
            --md-bk-color-outstand: color-mix(in srgb, var(--el-fill-color-dark) 88%, var(--el-bg-color-overlay));
            --md-bk-hover-color: color-mix(in srgb, var(--el-fill-color-darker) 88%, var(--el-color-primary) 12%);
            --md-border-color: var(--el-border-color);
            --md-border-hover-color: color-mix(in srgb, var(--el-color-primary) 50%, var(--el-border-color));
            --md-border-active-color: var(--el-color-primary);
        }

        :deep(.md-editor-input-wrapper) {
            background: linear-gradient(
                180deg,
                color-mix(in srgb, var(--el-fill-color-dark) 74%, var(--el-bg-color-overlay)) 0%,
                var(--el-bg-color-overlay) 100%
            );
        }

        :deep(.md-editor-toolbar-wrapper),
        :deep(.md-editor-resize-operate),
        :deep(.md-editor-footer) {
            background-color: color-mix(in srgb, var(--el-fill-color-dark) 92%, var(--el-bg-color-overlay));
        }

        :deep(.md-editor-toolbar-item:hover),
        :deep(.md-editor-toolbar-active) {
            background-color: color-mix(in srgb, var(--el-color-primary) 16%, var(--el-fill-color-dark));
        }

        :deep(.md-editor-menu),
        :deep(.md-editor-dropdown) {
            box-shadow: 0 14px 32px rgba(0, 0, 0, 0.42);
        }

        &.is-textarea-mode {
            :deep(.md-editor-toolbar-wrapper) {
                background: var(--el-bg-color-overlay);
            }

            :deep(.md-editor-input-wrapper) {
                background: var(--el-bg-color-overlay);
            }
        }
    }
}
</style>


