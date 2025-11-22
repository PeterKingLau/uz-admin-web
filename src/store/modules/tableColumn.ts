import { defineStore } from 'pinia'
import { PROFILE_AUDIT_TABLE_KEY, PROFILE_AUDIT_COLUMNS } from '@/config/table/profileAuditColumns'
import { CONTENT_AUDIT_TABLE_KEY, CONTENT_AUDIT_COLUMNS } from '@/config/table/contentAuditColumns'

// 定义 defaultProfileAuditKeys 和 defaultContentAuditKeys 的类型
const defaultProfileAuditKeys: string[] = PROFILE_AUDIT_COLUMNS.map(c => c.key)
const defaultContentAuditKeys: string[] = CONTENT_AUDIT_COLUMNS.map(c => c.key)

// 定义 enabledColumnKeysMap 的类型
interface EnabledColumnKeysMap {
    [key: string]: string[]
}

export const useTableColumnStore = defineStore('tableColumn', {
    state: () => ({
        enabledColumnKeysMap: {
            [PROFILE_AUDIT_TABLE_KEY]: [...defaultProfileAuditKeys],
            [CONTENT_AUDIT_TABLE_KEY]: [...defaultContentAuditKeys]
        } as EnabledColumnKeysMap
    }),

    getters: {
        // 定义 getEnabledKeys 方法的返回类型
        getEnabledKeys:
            state =>
            (tableKey: string): string[] => {
                return state.enabledColumnKeysMap[tableKey] || []
            }
    },

    actions: {
        // 定义 setEnabledKeys 方法的参数类型
        setEnabledKeys(tableKey: string, keys: string[]): void {
            this.enabledColumnKeysMap[tableKey] = [...keys]
        },

        resetToDefault(tableKey: string): void {
            if (tableKey === PROFILE_AUDIT_TABLE_KEY) {
                this.enabledColumnKeysMap[tableKey] = [...defaultProfileAuditKeys]
            } else if (tableKey === CONTENT_AUDIT_TABLE_KEY) {
                this.enabledColumnKeysMap[tableKey] = [...defaultContentAuditKeys]
            }
        }
    }
})
