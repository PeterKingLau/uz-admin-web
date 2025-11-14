import { defineStore } from "pinia";
import {
  PROFILE_AUDIT_TABLE_KEY,
  PROFILE_AUDIT_COLUMNS,
} from "@/config/table/profileAuditColumns.js";
import {
  CONTENT_AUDIT_TABLE_KEY,
  CONTENT_AUDIT_COLUMNS,
} from "@/config/table/contentAuditColumns.js";

const defaultProfileAuditKeys = PROFILE_AUDIT_COLUMNS.map((c) => c.key);
const defaultContentAuditKeys = CONTENT_AUDIT_COLUMNS.map((c) => c.key);

export const useTableColumnStore = defineStore("tableColumn", {
  state: () => ({
    enabledColumnKeysMap: {
      [PROFILE_AUDIT_TABLE_KEY]: [...defaultProfileAuditKeys],
      [CONTENT_AUDIT_TABLE_KEY]: [...defaultContentAuditKeys],
    },
  }),

  getters: {
    getEnabledKeys: (state) => (tableKey) => {
      return state.enabledColumnKeysMap[tableKey];
    },
  },

  actions: {
    setEnabledKeys(tableKey, keys) {
      this.enabledColumnKeysMap[tableKey] = [...keys];
    },

    resetToDefault(tableKey) {
      if (tableKey === PROFILE_AUDIT_TABLE_KEY) {
        this.enabledColumnKeysMap[tableKey] = [...defaultProfileAuditKeys];
      } else if (tableKey === CONTENT_AUDIT_TABLE_KEY) {
        this.enabledColumnKeysMap[tableKey] = [...defaultContentAuditKeys];
      }
    },
  },
});
