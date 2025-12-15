import { defineStore } from 'pinia'
import { PROFILE_AUDIT_TABLE_KEY, PROFILE_AUDIT_COLUMNS } from '@/config/table/profileAuditColumns'
import { CONTENT_AUDIT_TABLE_KEY, CONTENT_AUDIT_COLUMNS } from '@/config/table/contentAuditColumns'
import { TOPBAR_TABLE_KEY, TOPBAR_COLUMNS } from '@/config/table/topbarColumns'

const defaultProfileAuditKeys: string[] = PROFILE_AUDIT_COLUMNS.map(c => c.key)
const defaultContentAuditKeys: string[] = CONTENT_AUDIT_COLUMNS.map(c => c.key)
const defaultTopbarKeys: string[] = TOPBAR_COLUMNS.map(c => c.key)

interface EnabledColumnKeysMap {
    [key: string]: string[]
}

export const useTableColumnStore = defineStore('tableColumn', {
    state: () => ({
        enabledColumnKeysMap: {
            [PROFILE_AUDIT_TABLE_KEY]: [...defaultProfileAuditKeys],
            [CONTENT_AUDIT_TABLE_KEY]: [...defaultContentAuditKeys],
            [TOPBAR_TABLE_KEY]: [...defaultTopbarKeys]
        } as EnabledColumnKeysMap
    }),

    getters: {
        getEnabledKeys:
            state =>
            (tableKey: string): string[] => {
                return state.enabledColumnKeysMap[tableKey] || []
            }
    },

    actions: {
        setEnabledKeys(tableKey: string, keys: string[]): void {
            this.enabledColumnKeysMap[tableKey] = [...keys]
        },

        resetToDefault(tableKey: string): void {
            if (tableKey === PROFILE_AUDIT_TABLE_KEY) {
                this.enabledColumnKeysMap[tableKey] = [...defaultProfileAuditKeys]
            } else if (tableKey === CONTENT_AUDIT_TABLE_KEY) {
                this.enabledColumnKeysMap[tableKey] = [...defaultContentAuditKeys]
            } else if (tableKey === TOPBAR_TABLE_KEY) {
                this.enabledColumnKeysMap[tableKey] = [...defaultTopbarKeys]
            }
        }
    }
})
