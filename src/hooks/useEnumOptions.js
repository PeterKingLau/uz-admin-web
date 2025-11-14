import { computed } from "vue";
import { ENUM_TAG_CONFIG } from "@/utils/enum";

export function useEnumOptions(enumType, options = {}) {
  const { includeKeys } = options;

  return computed(() => {
    const group = ENUM_TAG_CONFIG[enumType] || {};
    const entries = Object.entries(group);

    return entries
      .filter(([value]) => !includeKeys || includeKeys.includes(value))
      .map(([value, cfg]) => ({
        value,
        label: cfg.label ?? String(value),
        ...cfg,
      }));
  });
}
