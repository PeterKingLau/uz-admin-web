<template>
  <div class="app-container">
    <!-- 查询条件 -->
    <el-form
      :model="queryParams"
      ref="queryRef"
      v-show="showSearch"
      :inline="true"
      label-width="68px"
      class="flex flex-wrap items-center gap-3 p-3"
    >
      <el-form-item label="内容标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入内容标题"
          clearable
          class="w-60"
          @keyup.enter="handleQuery"
        />
      </el-form-item>

      <el-form-item label="发布人" prop="author">
        <el-input
          v-model="queryParams.author"
          placeholder="请输入发布人"
          clearable
          class="w-60"
          @keyup.enter="handleQuery"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="审核状态"
          clearable
          style="width: 240px"
        >
          <el-option label="待审核" value="PENDING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="已驳回" value="REJECTED" />
        </el-select>
      </el-form-item>

      <el-form-item label="提交时间">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          range-separator="-"
          class="w-80"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">
          搜索
        </el-button>
        <el-button icon="Refresh" @click="resetQuery"> 重置 </el-button>
      </el-form-item>
    </el-form>

    <!-- 工具栏 -->
    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- 表格 -->
    <el-table
      v-loading="loading"
      :data="contentList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" prop="id" width="90" />
      <el-table-column
        label="标题"
        prop="title"
        min-width="200"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="发布人"
        prop="author"
        width="120"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="分类" prop="category" width="120" />
      <el-table-column
        label="提交时间"
        prop="createTime"
        width="160"
        align="center"
      />

      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'PENDING'" type="warning">
            待审核
          </el-tag>
          <el-tag v-else-if="scope.row.status === 'APPROVED'" type="success">
            已通过
          </el-tag>
          <el-tag v-else type="danger">已驳回</el-tag>
        </template>
      </el-table-column>

      <el-table-column
        label="操作"
        align="center"
        width="220"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-tooltip content="查看详情" placement="top">
            <el-button
              link
              type="primary"
              icon="View"
              @click="handleView(scope.row)"
            />
          </el-tooltip>

          <el-tooltip v-if="scope.row.status === 'PENDING'" content="通过">
            <el-button
              link
              type="success"
              icon="CircleCheck"
              @click="handleApprove(scope.row)"
            />
          </el-tooltip>

          <el-tooltip v-if="scope.row.status === 'PENDING'" content="驳回">
            <el-button
              link
              type="danger"
              icon="Close"
              @click="openRejectDialog(scope.row)"
            />
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

    <!-- 详情 -->
    <el-dialog
      v-model="openDetail"
      title="内容详情"
      width="720px"
      append-to-body
    >
      <el-descriptions :column="2" border class="mb-4">
        <el-descriptions-item label="编号">
          {{ current?.id }}
        </el-descriptions-item>
        <el-descriptions-item label="分类">
          {{ current?.category }}
        </el-descriptions-item>
        <el-descriptions-item label="标题">
          {{ current?.title }}
        </el-descriptions-item>
        <el-descriptions-item label="发布人">
          {{ current?.author }}
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">
          {{ current?.createTime }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="detail-block">
        <div class="font-bold mb-2">内容预览</div>
        <div
          class="bg-gray-100 p-3 rounded leading-6"
          v-html="current?.content"
        ></div>
      </div>

      <div v-if="current?.rejectReason" class="mt-4">
        <div class="font-bold mb-2">驳回原因</div>
        <div class="bg-red-50 p-3 rounded border-l-4 border-red-500 leading-6">
          {{ current.rejectReason }}
        </div>
      </div>

      <template #footer>
        <el-button @click="openDetail = false">关 闭</el-button>
      </template>
    </el-dialog>

    <!-- 驳回弹窗 -->
    <el-dialog
      title="驳回原因"
      v-model="openReject"
      width="400px"
      append-to-body
    >
      <el-input
        v-model="rejectForm.reason"
        type="textarea"
        :rows="4"
        placeholder="请输入驳回原因"
      />

      <template #footer>
        <div>
          <el-button @click="openReject = false">取 消</el-button>
          <el-button type="danger" @click="submitReject">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="PublishAudit">
import { ref, reactive, getCurrentInstance, onMounted } from "vue";

const { proxy } = getCurrentInstance();

const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const contentList = ref([]);

const ids = ref([]);
const dateRange = ref([]);

const openDetail = ref(false);
const openReject = ref(false);
const current = ref(null);
const rejectTarget = ref(null);

const rejectForm = reactive({ reason: "" });

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  title: undefined,
  author: undefined,
  status: "PENDING",
});

/** 模拟加载列表 */
function getList() {
  loading.value = true;

  setTimeout(() => {
    const rows = [];
    for (let i = 0; i < queryParams.pageSize; i++) {
      const idx = (queryParams.pageNum - 1) * queryParams.pageSize + i + 1;
      rows.push({
        id: idx,
        title: `发布内容标题 ${idx}`,
        author: idx % 2 === 0 ? "张三" : "李四",
        category: idx % 2 === 0 ? "新闻" : "公告",
        createTime: "2025-11-13 11:30:00",
        status: queryParams.status || "PENDING",
        content: `<p>这是第 <b>${idx}</b> 条内容预览。</p>`,
        rejectReason: "",
      });
    }
    contentList.value = rows;
    total.value = 56;
    loading.value = false;
  }, 300);
}

/** 搜索 */
function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

/** 重置 */
function resetQuery() {
  dateRange.value = [];
  proxy.resetForm("queryRef");
  queryParams.pageNum = 1;
  queryParams.status = "PENDING";
  getList();
}

/** 多选 */
function handleSelectionChange(selection) {
  ids.value = selection.map((item) => item.id);
}

/** 查看详情 */
function handleView(row) {
  current.value = row;
  openDetail.value = true;
}

/** 通过 */
function handleApprove(row) {
  row.status = "APPROVED";
  proxy.$modal?.msgSuccess("审核通过");
}

/** 打开驳回 */
function openRejectDialog(row) {
  rejectTarget.value = row;
  rejectForm.reason = "";
  openReject.value = true;
}

/** 提交驳回 */
function submitReject() {
  if (!rejectForm.reason.trim()) {
    proxy.$modal?.msgWarning("请输入驳回原因");
    return;
  }

  rejectTarget.value.status = "REJECTED";
  rejectTarget.value.rejectReason = rejectForm.reason;

  openReject.value = false;
  proxy.$modal?.msgSuccess("已驳回");
}

onMounted(() => {
  getList();
});
</script>
