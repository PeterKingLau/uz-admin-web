/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly VITE_APP_BASE_API: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module '@varlet/ui/es/*' {
    const value: any
    export default value
}

declare module '@varlet/ui/es/*/style'
