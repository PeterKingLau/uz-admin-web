<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      v-show="showSearch"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="资料类型" prop="applyType">
        <el-select
          v-model="queryParams.applyType"
          placeholder="请选择资料类型"
          clearable
          style="width: 180px"
        >
          <el-option
            v-for="item in apply_type"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="审核状态" prop="auditStatus">
        <el-select
          v-model="queryParams.auditStatus"
          placeholder="请选择审核状态"
          clearable
          style="width: 240px"
        >
          <el-option label="待审核" :value="AUDIT_STATUS.PENDING" />
          <el-option label="通过" :value="AUDIT_STATUS.APPROVED" />
          <el-option label="驳回" :value="AUDIT_STATUS.REJECTED" />
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

    <el-table
      v-loading="loading"
      :data="auditList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        type="selection"
        width="55"
        align="center"
        fixed="left"
      />
      <el-table-column
        label="用户名"
        prop="userName"
        width="140"
        fixed="left"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="昵称"
        prop="nickName"
        width="140"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="资料类型"
        prop="applyTypeDesc"
        width="120"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="原值" prop="oldValue" min-width="180">
        <template #default="scope">
          <template v-if="scope.row.applyType === 'avatar'">
            <AvatarPreview :src="scope.row.oldValue" :size="40" />
          </template>
          <template v-else>
            <span class="truncate">
              {{ scope.row.oldValue }}
            </span>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="新值" prop="newValue" min-width="180">
        <template #default="scope">
          <template v-if="scope.row.applyType === 'avatar'">
            <AvatarPreview
              :src="scope.row.newValue"
              :size="40"
              :deleted="scope.row.auditStatus === AUDIT_STATUS.REJECTED"
            />
          </template>
          <template v-else>
            {{ scope.row.newValue }}
          </template>
        </template>
      </el-table-column>

      <el-table-column
        label="审核状态"
        prop="auditStatus"
        width="100"
        align="center"
      >
        <template #default="scope">
          <el-tag
            v-if="scope.row.auditStatus === AUDIT_STATUS.PENDING"
            type="warning"
          >
            待审核
          </el-tag>
          <el-tag
            v-else-if="scope.row.auditStatus === AUDIT_STATUS.APPROVED"
            type="success"
          >
            通过
          </el-tag>
          <el-tag v-else type="danger">驳回</el-tag>
        </template>
      </el-table-column>

      <el-table-column
        label="审核备注"
        prop="auditRemark"
        min-width="180"
        :show-overflow-tooltip="true"
      >
        <template #default="scope">
          <span v-if="scope.row.auditStatus === AUDIT_STATUS.REJECTED">
            {{ scope.row.auditRemark || "无" }}
          </span>
        </template>
      </el-table-column>

      <el-table-column
        label="审核人"
        prop="auditBy"
        width="120"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="申请时间"
        prop="applyTime"
        width="160"
        align="center"
      />
      <el-table-column
        label="审核时间"
        prop="auditTime"
        width="160"
        align="center"
      />
      <el-table-column
        label="操作"
        align="center"
        width="120"
        class-name="small-padding fixed-width"
        fixed="right"
      >
        <template #default="scope">
          <el-tooltip content="查看详情" placement="top">
            <el-button link type="primary" @click="handleView(scope.row)">
              <el-icon>
                <Icon icon="ep:view" :size="20" />
              </el-icon>
            </el-button>
          </el-tooltip>

          <el-tooltip
            v-if="scope.row.auditStatus === AUDIT_STATUS.PENDING"
            content="通过"
            placement="top"
          >
            <el-button link type="success" @click="handleApprove(scope.row)">
              <el-icon>
                <Icon icon="mdi:check-circle-outline" :size="20" />
              </el-icon>
            </el-button>
          </el-tooltip>

          <el-tooltip
            v-if="scope.row.auditStatus === AUDIT_STATUS.PENDING"
            content="驳回"
            placement="top"
          >
            <el-button link type="danger" @click="openRejectDialog(scope.row)">
              <el-icon>
                <Icon icon="ep:close" :size="20" />
              </el-icon>
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog
      title="个人资料变更详情"
      v-model="openDetail"
      width="700px"
      append-to-body
    >
      <el-descriptions :column="2" border class="mb8">
        <el-descriptions-item label="用户名">
          {{ current?.userName }}
        </el-descriptions-item>
        <el-descriptions-item label="昵称">
          {{ current?.nickName }}
        </el-descriptions-item>
        <el-descriptions-item label="资料类型">
          {{ current?.applyTypeDesc }} ({{ current?.applyType }})
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">
          {{ current?.applyTime }}
        </el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag
            v-if="current?.auditStatus === AUDIT_STATUS.PENDING"
            type="warning"
          >
            待审核
          </el-tag>
          <el-tag
            v-else-if="current?.auditStatus === AUDIT_STATUS.APPROVED"
            type="success"
          >
            通过
          </el-tag>
          <el-tag v-else type="danger">驳回</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核人">
          {{ current?.auditBy }}
        </el-descriptions-item>
        <el-descriptions-item label="审核时间">
          {{ current?.auditTime }}
        </el-descriptions-item>
      </el-descriptions>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="原值">
          <template v-if="current?.applyType === 'avatar'">
            <AvatarPreview :src="current?.oldValue" :size="80" />
          </template>
          <template v-else>
            {{ current?.oldValue }}
          </template>
        </el-descriptions-item>

        <el-descriptions-item label="新值">
          <template v-if="current?.applyType === 'avatar'">
            <AvatarPreview
              :src="current?.newValue"
              :size="80"
              :deleted="current?.auditStatus === AUDIT_STATUS.REJECTED"
            />
          </template>
          <template v-else>
            {{ current?.newValue }}
          </template>
        </el-descriptions-item>

        <el-descriptions-item label="审核备注">
          {{ current?.auditRemark }}
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
        v-model="rejectForm.auditRemark"
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

<script setup name="ProfileAudit">
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { Icon } from "@iconify/vue";
import { listUserAuditDetail, auditUserAvatar } from "@/api/audit/person";
import AvatarPreview from "@/components/AvatarPreview/index.vue";
import { AUDIT_STATUS } from "@/utils/enum";

const { proxy } = getCurrentInstance();

const { apply_type } = proxy.useDict("apply_type");

const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const auditList = ref([]);

const ids = ref([]);
const dateRange = ref([]);

const openDetail = ref(false);
const openReject = ref(false);
const current = ref(null);
const rejectTarget = ref(null);

const rejectForm = reactive({
  auditRemark: "",
});

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  applyType: undefined,
  auditStatus: AUDIT_STATUS.PENDING,
});

function getList() {
  loading.value = true;
  const query = proxy.addDateRange
    ? proxy.addDateRange(queryParams, dateRange.value)
    : queryParams;

  listUserAuditDetail(query).then((res) => {
    auditList.value = res.rows || [];
    total.value = res.total || 0;
    loading.value = false;
  });
}

function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

function resetQuery() {
  dateRange.value = [];
  proxy.resetForm("queryRef");
  queryParams.pageNum = 1;
  queryParams.pageSize = 10;
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
  const id = row.id;
  if (!id) return;

  proxy.$modal
    ?.confirm?.("确认通过该资料变更吗？")
    .then(() => {
      return auditUserAvatar({
        id,
        auditStatus: AUDIT_STATUS.APPROVED,
        auditRemark: row.auditRemark || "",
      });
    })
    .then(() => {
      proxy.$modal?.msgSuccess && proxy.$modal.msgSuccess("审核通过");
      getList();
    })
    .catch(() => {});
}

function openRejectDialog(row) {
  rejectTarget.value = row;
  rejectForm.auditRemark = row.auditRemark || "";
  openReject.value = true;
}

function submitReject() {
  const remark = rejectForm.auditRemark?.trim();
  const target = rejectTarget.value;

  if (!target || !target.id) {
    proxy.$modal?.msgError && proxy.$modal.msgError("未找到要驳回的记录");
    return;
  }

  if (!remark) {
    proxy.$modal?.msgWarning
      ? proxy.$modal.msgWarning("请填写驳回原因")
      : ElMessage.warning("请填写驳回原因");
    return;
  }

  auditUserAvatar({
    id: target.id,
    auditStatus: AUDIT_STATUS.REJECTED,
    auditRemark: remark,
  })
    .then(() => {
      proxy.$modal?.msgSuccess && proxy.$modal.msgSuccess("已驳回");
      openReject.value = false;
      getList();
    })
    .catch(() => {});
}

onMounted(() => {
  getList();
});
</script>
