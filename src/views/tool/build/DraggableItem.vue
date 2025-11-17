<template>
  <el-col
    :span="element.span"
    :class="className"
    @click.stop="activeItem(element)"
  >
    <!-- 普通表单项 -->
    <el-form-item
      v-if="element.layout === 'colFormItem'"
      :label="element.label"
      :label-width="element.labelWidth ? element.labelWidth + 'px' : null"
      :required="element.required"
    >
      <render
        :key="element.tag"
        :conf="element"
        v-model="element.defaultValue"
      />
    </el-form-item>

    <!-- 行布局（里面还能拖子组件） -->
    <el-row
      v-else
      :gutter="element.gutter"
      :class="element.class"
      @click.stop="activeItem(element)"
    >
      <span class="component-name">
        {{ element.componentName }}
      </span>

      <VueDraggable
        ref="draggableItemRef"
        class="drag-wrapper"
        v-model="element.children"
        group="componentsGroup"
        item-key="formId"
        :animation="340"
      >
        <template #item="{ element: child, index: childIndex }">
          <draggable-item
            :key="child.renderKey"
            :drawing-list="element.children"
            :element="child"
            :index="childIndex"
            :active-id="activeId"
            :form-conf="formConf"
            @activeItem="activeItem(child)"
            @copyItem="copyItem(child, element.children)"
            @deleteItem="deleteItem(childIndex, element.children)"
          />
        </template>
      </VueDraggable>
    </el-row>

    <!-- 右上角复制 / 删除按钮 -->
    <span
      class="drawing-item-copy"
      title="复制"
      @click.stop="copyItem(element)"
    >
      <el-icon>
        <CopyDocument />
      </el-icon>
    </span>
    <span
      class="drawing-item-delete"
      title="删除"
      @click.stop="deleteItem(index)"
    >
      <el-icon>
        <Delete />
      </el-icon>
    </span>
  </el-col>
</template>

<script setup name="DraggableItem">
import { ref, watch } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import render from "@/utils/generator/render";

const props = defineProps({
  element: Object,
  index: Number,
  drawingList: Array,
  activeId: {
    type: [String, Number],
  },
  formConf: Object,
});

const className = ref("");
const draggableItemRef = ref(null);

const emits = defineEmits(["activeItem", "copyItem", "deleteItem"]);

function activeItem(item) {
  emits("activeItem", item);
}

function copyItem(item, parent) {
  emits("copyItem", item, parent ?? props.drawingList);
}

function deleteItem(index, parent) {
  emits("deleteItem", index, parent ?? props.drawingList);
}

watch(
  () => props.activeId,
  (val) => {
    className.value =
      (props.element.layout === "rowFormItem"
        ? "drawing-row-item"
        : "drawing-item") +
      (val === props.element.formId ? " active-from-item" : "");
    if (props.formConf.unFocusedComponentBorder) {
      className.value += " unfocus-bordered";
    }
  },
  { immediate: true }
);
</script>
