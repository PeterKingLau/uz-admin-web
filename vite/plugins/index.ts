import type { PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoImport from 'unplugin-auto-import/vite'
import components from 'unplugin-vue-components/vite'
import { compression } from 'vite-plugin-compression2'
import checker from 'vite-plugin-checker'

interface ViteEnv {
    VITE_BUILD_COMPRESS?: string
    VITE_DEV_CHECKER?: string
}

const SOURCE_FILE_RE = /\.[cm]?[jt]sx?$/
const VUE_FILE_RE = /\.vue$/
const NODE_MODULES_RE = /[/\\]node_modules[/\\]/
const DIST_RE = /[/\\]dist[/\\]/
const PUBLIC_RE = /[/\\]public[/\\]/
const ESLINT_COMMAND = 'eslint "src/**/*.{js,ts,vue}" "vite/**/*.ts" vite.config.ts eslint.config.js'
const STYLELINT_COMMAND = 'stylelint "src/**/*.vue" --allow-empty-input'

const compressionAlgorithmMap = {
    gzip: 'gzip',
    gz: 'gzip',
    brotli: 'brotliCompress',
    br: 'brotliCompress',
    brotlicompress: 'brotliCompress'
} as const

type CompressionAlgorithm = (typeof compressionAlgorithmMap)[keyof typeof compressionAlgorithmMap]

export default function createVitePlugins(env: ViteEnv, isBuild = false): PluginOption[] {
    return [
        ...createDevPlugins(env, isBuild),
        vue(),
        autoImport({
            imports: ['vue', 'vue-router', 'pinia'],
            include: [SOURCE_FILE_RE, VUE_FILE_RE],
            exclude: [NODE_MODULES_RE, DIST_RE, PUBLIC_RE],
            dts: false,
            vueTemplate: false
        }),
        components({
            dirs: ['src/components'],
            extensions: ['vue'],
            deep: true,
            directoryAsNamespace: true,
            dts: 'src/types/components.d.ts'
        }),
        ...createCompression(env, isBuild)
    ]
}

function createDevPlugins(env: ViteEnv, isBuild: boolean): PluginOption[] {
    if (isBuild || env.VITE_DEV_CHECKER === 'false') return []

    return [
        checker({
            vueTsc: true,
            eslint: {
                lintCommand: ESLINT_COMMAND
            },
            stylelint: {
                lintCommand: STYLELINT_COMMAND
            },
            overlay: {
                initialIsOpen: 'error',
                position: 'br'
            }
        })
    ]
}

function parseCompressionAlgorithms(value?: string): CompressionAlgorithm[] {
    const normalizedValue = String(value || '').trim().toLowerCase()
    if (!normalizedValue || ['false', 'none', 'off', '0'].includes(normalizedValue)) return []
    const rawAlgorithms = normalizedValue === 'true' ? ['gzip'] : normalizedValue.split(',')

    return Array.from(
        new Set(
            rawAlgorithms
                .map(type => type.trim().replace(/[-_]/g, ''))
                .map(type => compressionAlgorithmMap[type as keyof typeof compressionAlgorithmMap])
                .filter((type): type is CompressionAlgorithm => Boolean(type))
        )
    )
}

function createCompression(env: ViteEnv, isBuild: boolean): PluginOption[] {
    if (!isBuild) return []

    const algorithms = parseCompressionAlgorithms(env.VITE_BUILD_COMPRESS)
    if (!algorithms.length) return []

    return [
        compression({
            algorithms,
            deleteOriginalAssets: false
        })
    ]
}
