<template>
  <div class="app-container">
    <!-- 查询条件 -->
    <el-form
      :model="queryParams"
      ref="queryRef"
      v-show="showSearch"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="用户名称" prop="userName">
        <el-input
          v-model="queryParams.userName"
          placeholder="请输入用户名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>

      <el-form-item label="手机号码" prop="phonenumber">
        <el-input
          v-model="queryParams.phonenumber"
          placeholder="请输入手机号码"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>

      <el-form-item label="审核状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择审核状态"
          clearable
          style="width: 240px"
        >
          <el-option label="待审核" value="PENDING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="已驳回" value="REJECTED" />
        </el-select>
      </el-form-item>

      <el-form-item label="提交时间" style="width: 308px">
        <el-date-picker
          v-model="dateRange"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
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
      <!-- 如果你有批量操作，可以在这里加按钮，比如导出 -->
      <!--
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      -->
      <right-toolbar
        v-model:showSearch="showSearch"
        @queryTable="getList"
      ></right-toolbar>
    </el-row>

    <!-- 表格数据 -->
    <el-table
      v-loading="loading"
      :data="profileList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="申请编号" prop="id" width="100" align="center" />
      <el-table-column
        label="用户ID"
        prop="userId"
        width="100"
        align="center"
      />
      <el-table-column
        label="用户名称"
        prop="userName"
        :show-overflow-tooltip="true"
        width="140"
      />
      <el-table-column
        label="昵称"
        prop="nickName"
        :show-overflow-tooltip="true"
        width="140"
      />
      <el-table-column
        label="手机号码"
        prop="phonenumber"
        width="130"
        align="center"
      />
      <el-table-column
        label="邮箱"
        prop="email"
        :show-overflow-tooltip="true"
        min-width="180"
      />
      <el-table-column label="性别" prop="sexLabel" width="80" align="center" />
      <el-table-column
        label="提交时间"
        prop="createTime"
        width="160"
        align="center"
      />
      <el-table-column label="审核状态" width="100" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'PENDING'" type="warning">
            待审核
          </el-tag>
          <el-tag v-else-if="scope.row.status === 'APPROVED'" type="success">
            已通过
          </el-tag>
          <el-tag v-else type="danger"> 已驳回 </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        width="220"
      >
        <template #default="scope">
          <el-tooltip content="查看详情" placement="top">
            <el-button link type="primary" @click="handleView(scope.row)">
              <el-icon> <Icon icon="ep:view"></Icon> </el-icon
            ></el-button>
          </el-tooltip>

          <el-tooltip
            content="通过"
            placement="top"
            v-if="scope.row.status === 'PENDING'"
          >
            <el-button link type="success" @click="handleApprove(scope.row)">
              <el-icon> <Icon icon="mdi:check-circle-outline"></Icon> </el-icon
            ></el-button>
          </el-tooltip>

          <el-tooltip
            content="驳回"
            placement="top"
            v-if="scope.row.status === 'PENDING'"
          >
            <el-button link type="danger" @click="openRejectDialog(scope.row)">
              <el-icon> <Icon icon="ep:close"></Icon> </el-icon>
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

    <!-- 详情对话框 -->
    <el-dialog
      title="个人资料详情"
      v-model="openDetail"
      width="600px"
      append-to-body
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="申请编号">
          {{ current?.id }}
        </el-descriptions-item>
        <el-descriptions-item label="用户ID">
          {{ current?.userId }}
        </el-descriptions-item>
        <el-descriptions-item label="用户名称">
          {{ current?.userName }}
        </el-descriptions-item>
        <el-descriptions-item label="昵称">
          {{ current?.nickName }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号码">
          {{ current?.phonenumber }}
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          {{ current?.email }}
        </el-descriptions-item>
        <el-descriptions-item label="性别">
          {{ current?.sexLabel }}
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">
          {{ current?.createTime }}
        </el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag v-if="current?.status === 'PENDING'" type="warning">
            待审核
          </el-tag>
          <el-tag v-else-if="current?.status === 'APPROVED'" type="success">
            已通过
          </el-tag>
          <el-tag v-else type="danger"> 已驳回 </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="openDetail = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 驳回原因对话框 -->
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

<script setup name="ProfileAudit">
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
// TODO:真实的接口
// import { listProfileAudit, approveProfile, rejectProfile } from "@/api/system/profileAudit";

const { proxy } = getCurrentInstance();

const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const profileList = ref([]);

const ids = ref([]);
const single = ref(true);
const multiple = ref(true);

const dateRange = ref([]);

const openDetail = ref(false);
const openReject = ref(false);
const current = ref(null);

const rejectForm = reactive({
  reason: "",
});
const rejectTarget = ref(null);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  userName: undefined,
  phonenumber: undefined,
  status: "PENDING",
});

function getList() {
  loading.value = true;

  // 实际使用时，你可以这样调用接口：
  // listProfileAudit(proxy.addDateRange(queryParams, dateRange.value)).then(res => {
  //   profileList.value = res.rows;
  //   total.value = res.total;
  //   loading.value = false;
  // });

  // 这里先用 mock 数据
  setTimeout(() => {
    const rows = [];
    for (let i = 0; i < queryParams.pageSize; i++) {
      const idx = (queryParams.pageNum - 1) * queryParams.pageSize + i + 1;
      rows.push({
        id: idx,
        userId: 10000 + idx,
        userName: `user_${idx}`,
        nickName: `昵称${idx}`,
        phonenumber: "1380000" + String(1000 + idx),
        email: `user_${idx}@example.com`,
        sex: idx % 2 === 0 ? "0" : "1",
        sexLabel: idx % 2 === 0 ? "男" : "女",
        createTime: "2025-11-13 11:30:00",
        status: queryParams.status || "PENDING",
      });
    }
    profileList.value = rows;
    total.value = 88;
    loading.value = false;
  }, 300);
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = [];
  proxy.resetForm("queryRef");
  queryParams.pageNum = 1;
  queryParams.pageSize = 10;
  queryParams.status = "PENDING";
  getList();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 查看详情 */
function handleView(row) {
  current.value = row;
  openDetail.value = true;
}

/** 审核通过 */
function handleApprove(row) {
  // 实际调用接口：
  // approveProfile(row.id).then(() => {
  //   proxy.$modal.msgSuccess("审核通过");
  //   getList();
  // });

  row.status = "APPROVED";
  proxy.$modal?.msgSuccess && proxy.$modal.msgSuccess("审核通过（mock）");
}

/** 打开驳回对话框 */
function openRejectDialog(row) {
  rejectTarget.value = row;
  rejectForm.reason = "";
  openReject.value = true;
}

/** 提交驳回 */
function submitReject() {
  if (!rejectForm.reason.trim()) {
    proxy.$modal?.msgWarning
      ? proxy.$modal.msgWarning("请填写驳回原因")
      : ElMessage.warning("请填写驳回原因");
    return;
  }

  // 实际调用接口：
  // rejectProfile({ id: rejectTarget.value.id, reason: rejectForm.reason }).then(() => {
  //   proxy.$modal.msgSuccess("已驳回");
  //   getList();
  // });

  rejectTarget.value.status = "REJECTED";
  rejectTarget.value.rejectReason = rejectForm.reason;
  openReject.value = false;
  proxy.$modal?.msgSuccess && proxy.$modal.msgSuccess("已驳回（mock）");
}

onMounted(() => {
  getList();
});
</script>
