import type { PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoImport from 'unplugin-auto-import/vite'
import components from 'unplugin-vue-components/vite'
import { compression } from 'vite-plugin-compression2'
import checker from 'vite-plugin-checker'

interface ViteEnv {
    VITE_BUILD_COMPRESS?: string
}

export default function createVitePlugins(env: ViteEnv, isBuild = false): PluginOption[] {
    return [
        ...createDevPlugins(isBuild),
        vue(),
        autoImport({
            imports: ['vue', 'vue-router', 'pinia'],
            include: [/\.[jt]s$/, /\.vue$/],
            exclude: [/[/\\]node_modules[/\\]/, /[/\\]dist[/\\]/, /[/\\]public[/\\]/],
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

function createDevPlugins(isBuild: boolean): PluginOption[] {
    if (isBuild) return []

    return [
        checker({
            vueTsc: true,
            eslint: {
                lintCommand: 'eslint "src/**/*.{js,ts,vue}" "vite/**/*.ts" vite.config.ts eslint.config.js'
            },
            stylelint: {
                lintCommand: 'stylelint "src/**/*.vue" --allow-empty-input'
            },
            overlay: {
                initialIsOpen: 'error',
                position: 'br'
            }
        })
    ]
}

function createCompression(env: ViteEnv, isBuild: boolean): PluginOption[] {
    if (!isBuild || !env.VITE_BUILD_COMPRESS) return []

    const algorithmMap = {
        gzip: 'gzip',
        brotli: 'brotliCompress'
    } as const
    const algorithms = env.VITE_BUILD_COMPRESS.split(',')
        .map(type => String(type || '').trim().toLowerCase())
        .map(type => algorithmMap[type as keyof typeof algorithmMap])
        .filter((type): type is (typeof algorithmMap)[keyof typeof algorithmMap] => Boolean(type))

    if (!algorithms.length) return []

    return [
        compression({
            algorithms,
            deleteOriginalAssets: false
        })
    ]
}
