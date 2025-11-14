<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      v-show="showSearch"
      :inline="true"
      label-width="68px"
    >
      <!-- 帖子类型 -->
      <el-form-item label="帖子类型" prop="postType">
        <el-select
          v-model="queryParams.postType"
          placeholder="请选择帖子类型"
          clearable
          style="width: 240px"
        >
          <el-option
            v-for="opt in postTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          >
            <!-- 下拉项里显示 Tag -->
            <EnumTag enum-type="POST_TYPE" :value="opt.value" />
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 审核状态 -->
      <el-form-item label="审核状态" prop="auditStatus">
        <el-select
          v-model="queryParams.auditStatus"
          placeholder="请选择审核状态"
          clearable
          style="width: 240px"
        >
          <el-option
            v-for="opt in auditStatusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          >
            <EnumTag enum-type="AUDIT_STATUS" :value="opt.value" />
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 内容状态 -->
      <el-form-item label="内容状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择内容状态"
          clearable
          style="width: 240px"
        >
          <el-option
            v-for="opt in contentStatusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          >
            <EnumTag enum-type="CONTENT_STATUS" :value="opt.value" />
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <el-icon><Icon icon="ep:search" /></el-icon>搜索
        </el-button>
        <el-button @click="resetQuery">
          <el-icon><Icon icon="ep:refresh" /></el-icon>
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <ConfigTable
      :loading="loading"
      :data="contentList"
      :columns="columns"
      :table-props="{ style: 'width: 100%' }"
      @selection-change="handleSelectionChange"
    >
      <template #postType="{ row }">
        <EnumTag enum-type="POST_TYPE" :value="row.postType" />
      </template>

      <!-- 图片/视频列 -->
      <template #media="{ row }">
        <AuditMediaPreview
          :post-type="row.postType"
          :media-urls="row.mediaUrls"
          :audit-status="row.auditStatus"
          :mode="AUDIT_MEDIA_MODE.CELL"
        />
      </template>

      <!-- 内容状态列 -->
      <template #status="{ row }">
        <EnumTag enum-type="CONTENT_STATUS" :value="row.status" />
      </template>

      <!-- 审核状态列 -->
      <template #auditStatus="{ row }">
        <EnumTag enum-type="AUDIT_STATUS" :value="row.auditStatus" />
      </template>

      <!-- 操作列 -->
      <template #operations="{ row }">
        <el-tooltip content="查看详情" placement="top">
          <el-button link type="primary" @click="handleView(row)">
            <el-icon>
              <Icon icon="ep:view" />
            </el-icon>
          </el-button>
        </el-tooltip>

        <template v-if="row.auditStatus === AUDIT_STATUS.PENDING">
          <el-tooltip content="通过" placement="top">
            <el-button link type="success" @click="handleApprove(row)">
              <el-icon>
                <Icon icon="mdi:check-circle-outline" />
              </el-icon>
            </el-button>
          </el-tooltip>

          <el-tooltip content="驳回" placement="top">
            <el-button link type="danger" @click="openRejectDialog(row)">
              <el-icon>
                <Icon icon="ep:close" />
              </el-icon>
            </el-button>
          </el-tooltip>
        </template>
      </template>
    </ConfigTable>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog
      title="内容详情"
      v-model="openDetail"
      width="720px"
      append-to-body
    >
      <el-descriptions :column="2" border class="mb8">
        <el-descriptions-item label="用户名">
          {{ current?.userName }}
        </el-descriptions-item>
        <el-descriptions-item label="用户昵称">
          {{ current?.nickName }}
        </el-descriptions-item>
        <el-descriptions-item label="帖子类型">
          <EnumTag
            enum-type="POST_TYPE"
            :value="current?.postType"
            fallback-label="未知"
          />
        </el-descriptions-item>

        <el-descriptions-item label="内容状态">
          <EnumTag enum-type="CONTENT_STATUS" :value="current?.status" />
        </el-descriptions-item>

        <el-descriptions-item label="审核状态">
          <EnumTag enum-type="AUDIT_STATUS" :value="current?.auditStatus" />
        </el-descriptions-item>

        <el-descriptions-item label="审核理由">
          {{ current?.reason || "-" }}
        </el-descriptions-item>
      </el-descriptions>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="内容">
          <div class="whitespace-pre-wrap">
            {{ current?.content }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="图片/视频">
          <AuditMediaPreview
            :post-type="current.postType"
            :media-urls="current.mediaUrls"
            :audit-status="current.auditStatus"
            :mode="AUDIT_MEDIA_MODE.DETAIL"
          />
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="openDetail = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      title="驳回原因"
      v-model="openReject"
      width="420px"
      append-to-body
    >
      <el-input
        v-model="rejectForm.reason"
        type="textarea"
        :rows="4"
        placeholder="请输入驳回原因"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="openReject = false">取 消</el-button>
          <el-button type="danger" @click="submitReject">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ContentAudit">
import { ref, reactive, onMounted, getCurrentInstance, computed } from "vue";
import { Icon } from "@iconify/vue";
import { listContentAudit, auditPost } from "@/api/audit/content";
import AuditMediaPreview from "@/components/AuditMediaPreview/index.vue";
import ConfigTable from "@/components/ConfigTable/index.vue";
import {
  POST_TYPE,
  AUDIT_STATUS,
  AUDIT_MEDIA_MODE,
  CONTENT_STATUS,
} from "@/utils/enum";
import EnumTag from "@/components/EnumTag/index.vue";
import {
  CONTENT_AUDIT_COLUMNS,
  CONTENT_AUDIT_TABLE_KEY,
} from "@/config/table/contentAuditColumns.js";
import { useTableColumnStore } from "@/store/modules/tableColumn";
import { useEnumOptions } from "@/hooks/useEnumOptions";

const { proxy } = getCurrentInstance();

const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const contentList = ref([]);

const ids = ref([]);

const openDetail = ref(false);
const openReject = ref(false);
const current = ref(null);
const rejectTarget = ref(null);

const rejectForm = reactive({
  reason: "",
});

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  postType: undefined,
  status: undefined,
  auditStatus: AUDIT_STATUS.PENDING,
});

const tableColumnStore = useTableColumnStore();

const baseColumnMap = computed(() => {
  const map = new Map();
  CONTENT_AUDIT_COLUMNS.forEach((col) => {
    map.set(col.key, col);
  });
  return map;
});

const columns = computed(() => {
  const enabledKeys =
    tableColumnStore.getEnabledKeys(CONTENT_AUDIT_TABLE_KEY) ||
    CONTENT_AUDIT_COLUMNS.map((c) => c.key);

  const map = baseColumnMap.value;
  return enabledKeys.map((key) => map.get(key)).filter(Boolean);
});

const postTypeOptions = useEnumOptions("POST_TYPE");
const auditStatusOptions = useEnumOptions("AUDIT_STATUS");
const contentStatusOptions = useEnumOptions("CONTENT_STATUS");

function getList() {
  loading.value = true;
  listContentAudit(queryParams).then((res) => {
    contentList.value = res.rows || [];
    total.value = res.total || 0;
    loading.value = false;
  });
}

function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

function resetQuery() {
  proxy.resetForm("queryRef");
  queryParams.pageNum = 1;
  queryParams.pageSize = 10;
  queryParams.postType = undefined;
  queryParams.status = undefined;
  queryParams.auditStatus = AUDIT_STATUS.PENDING;
  getList();
}

function handleSelectionChange(selection) {
  ids.value = selection.map((item) => item.id);
}

function handleView(row) {
  current.value = row;
  openDetail.value = true;
}

function handleApprove(row) {
  proxy.$modal
    .confirm(`确认将该内容审核通过吗？`)
    .then(() => {
      return auditPost({
        id: row.id,
        auditStatus: AUDIT_STATUS.APPROVED,
        reason: row.reason || "审核通过",
      });
    })
    .then(() => {
      proxy.$modal.msgSuccess("审核通过");
      getList();
      if (openDetail.value && current.value && current.value.id === row.id) {
        current.value.auditStatus = AUDIT_STATUS.APPROVED;
        current.value.reason = row.reason || "审核通过";
      }
    })
    .catch(() => {});
}

function openRejectDialog(row) {
  rejectTarget.value = row;
  rejectForm.reason = row.reason || "";
  openReject.value = true;
}

function submitReject() {
  if (!rejectForm.reason.trim()) {
    if (proxy.$modal?.msgWarning) {
      proxy.$modal.msgWarning("请填写驳回原因");
    } else {
      ElMessage.warning("请填写驳回原因");
    }
    return;
  }

  auditPost({
    id: rejectTarget.value.id,
    auditStatus: AUDIT_STATUS.REJECTED,
    reason: rejectForm.reason,
  })
    .then(() => {
      proxy.$modal?.msgSuccess && proxy.$modal.msgSuccess("已驳回");
      openReject.value = false;
      getList();
      if (
        openDetail.value &&
        current.value &&
        current.value.id === rejectTarget.value.id
      ) {
        current.value.auditStatus = AUDIT_STATUS.REJECTED;
        current.value.reason = rejectForm.reason;
      }
    })
    .catch(() => {});
}

onMounted(() => {
  getList();
});
</script>
