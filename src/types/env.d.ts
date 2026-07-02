/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly VITE_APP_BASE_API: string
    readonly VITE_APP_FILE_BASE_URL?: string
    readonly VITE_CLIENT_BASE_URL?: string
    readonly VITE_APP_REMEMBER_ME_DAYS?: string
    readonly VITE_BUILD_HARDEN?: string
    readonly VITE_DROP_CONSOLE?: string
    readonly VITE_ENABLE_OBFUSCATION?: string
    readonly VITE_GENERATE_SOURCEMAP?: string
    readonly VITE_OBSCURE_BUNDLE_NAMES?: string
    readonly VITE_USE_TERSER?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
