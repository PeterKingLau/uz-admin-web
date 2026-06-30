/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly VITE_APP_BASE_API: string
    readonly VITE_APP_FILE_BASE_URL?: string
    readonly VITE_CLIENT_BASE_URL?: string
    readonly VITE_APP_REMEMBER_ME_DAYS?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
