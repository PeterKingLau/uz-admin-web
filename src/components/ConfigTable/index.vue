<template>
  <el-table
    v-loading="loading"
    :data="data"
    v-bind="tableProps"
    @selection-change="onSelectionChange"
  >
    <el-table-column
      v-for="col in columns"
      :key="col.prop || col.type || col.label"
      v-bind="getColumnProps(col)"
    >
      <template v-if="col.slot || col.prop" #default="scope">
        <slot v-if="col.slot" :name="col.slot" v-bind="scope" />
        <slot v-else-if="$slots[col.prop]" :name="col.prop" v-bind="scope" />
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
const props = defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  tableProps: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["selection-change"]);

function onSelectionChange(val) {
  emit("selection-change", val);
}

function getColumnProps(col) {
  const { slot, headerSlot, ...rest } = col;
  return rest;
}
</script>
