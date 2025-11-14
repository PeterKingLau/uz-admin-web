<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      v-show="showSearch"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="帖子类型" prop="postType">
        <el-select
          v-model="queryParams.postType"
          placeholder="请选择帖子类型"
          clearable
          style="width: 240px"
        >
          <el-option label="文字" :value="POST_TYPE.TEXT" />
          <el-option label="图片" :value="POST_TYPE.IMAGE" />
          <el-option label="视频" :value="POST_TYPE.VIDEO" />
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
          <el-option label="审核通过" :value="AUDIT_STATUS.APPROVED" />
          <el-option label="审核未通过" :value="AUDIT_STATUS.REJECTED" />
        </el-select>
      </el-form-item>

      <el-form-item label="内容状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择内容状态"
          clearable
          style="width: 240px"
        >
          <el-option label="正常" :value="CONTENT_STATUS.NORMAL" />
          <el-option label="删除" :value="CONTENT_STATUS.DELETED" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">
          搜索
        </el-button>
        <el-button icon="Refresh" @click="resetQuery"> 重置 </el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table
      v-loading="loading"
      :data="contentList"
      style="width: 100%"
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
        label="用户昵称"
        prop="nickName"
        width="140"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="帖子类型"
        prop="postType"
        width="100"
        align="center"
      >
        <template #default="scope">
          <span v-if="scope.row.postType === POST_TYPE.TEXT">文字</span>
          <span v-else-if="scope.row.postType === POST_TYPE.IMAGE">图片</span>
          <span v-else-if="scope.row.postType === POST_TYPE.VIDEO">视频</span>
          <span v-else>未知</span>
        </template>
      </el-table-column>

      <el-table-column
        label="内容"
        prop="content"
        min-width="220"
        :show-overflow-tooltip="true"
      />

      <el-table-column label="图片/视频" min-width="220">
        <template #default="scope">
          <AuditMediaPreview
            :post-type="scope.row.postType"
            :media-urls="scope.row.mediaUrls"
            :audit-status="scope.row.auditStatus"
            :mode="AUDIT_MEDIA_MODE.CELL"
          />
        </template>
      </el-table-column>

      <el-table-column
        label="点赞数"
        prop="likeCount"
        width="100"
        align="center"
      />
      <el-table-column
        label="收藏数"
        prop="bookmarkCount"
        width="100"
        align="center"
      />
      <el-table-column
        label="转发数"
        prop="repostCount"
        width="100"
        align="center"
      />
      <el-table-column
        label="评论数"
        prop="commentCount"
        width="100"
        align="center"
      />

      <el-table-column
        label="内容状态"
        prop="status"
        width="100"
        align="center"
      >
        <template #default="scope">
          <el-tag
            v-if="scope.row.status === CONTENT_STATUS.NORMAL"
            type="success"
          >
            正常
          </el-tag>
          <el-tag v-else type="info">删除</el-tag>
        </template>
      </el-table-column>

      <el-table-column
        label="审核状态"
        prop="auditStatus"
        width="120"
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
            审核通过
          </el-tag>
          <el-tag v-else type="danger"> 审核未通过 </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        label="审核理由"
        prop="reason"
        min-width="180"
        :show-overflow-tooltip="true"
      />

      <el-table-column
        fixed="right"
        label="操作"
        align="center"
        width="220"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-tooltip content="查看详情" placement="top">
            <el-button link type="primary" @click="handleView(scope.row)">
              <el-icon>
                <Icon icon="ep:view" />
              </el-icon>
            </el-button>
          </el-tooltip>

          <template v-if="scope.row.auditStatus === AUDIT_STATUS.PENDING">
            <el-tooltip content="通过" placement="top">
              <el-button link type="success" @click="handleApprove(scope.row)">
                <el-icon>
                  <Icon icon="mdi:check-circle-outline" />
                </el-icon>
              </el-button>
            </el-tooltip>

            <el-tooltip content="驳回" placement="top">
              <el-button
                link
                type="danger"
                @click="openRejectDialog(scope.row)"
              >
                <el-icon>
                  <Icon icon="ep:close" />
                </el-icon>
              </el-button>
            </el-tooltip>
          </template>
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
          <span v-if="current?.postType === POST_TYPE.TEXT">文字</span>
          <span v-else-if="current?.postType === POST_TYPE.IMAGE">图片</span>
          <span v-else-if="current?.postType === POST_TYPE.VIDEO">视频</span>
          <span v-else>未知</span>
        </el-descriptions-item>
        <el-descriptions-item label="内容状态">
          <el-tag
            v-if="current?.status === CONTENT_STATUS.NORMAL"
            type="success"
          >
            正常
          </el-tag>
          <el-tag v-else type="info">删除</el-tag>
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
            审核通过
          </el-tag>
          <el-tag v-else type="danger"> 审核未通过 </el-tag>
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
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { Icon } from "@iconify/vue";
import { listContentAudit, auditPost } from "@/api/audit/content";
import AuditMediaPreview from "@/components/AuditMediaPreview/index.vue";
import { POST_TYPE, AUDIT_STATUS, AUDIT_MEDIA_MODE } from "@/utils/enum";

const CONTENT_STATUS = {
  NORMAL: "0",
  DELETED: "1",
};

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
