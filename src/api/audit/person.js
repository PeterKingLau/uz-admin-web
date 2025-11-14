import request from "@/utils/request";

// 个人资料审核列表
export function listUserAuditDetail(query) {
  return request({
    url: "/system/sysUserAuditDetail/list",
    method: "get",
    params: query,
  });
}

// 个人资料审核（通过 / 驳回）
export function auditUserAvatar(data) {
  // data: { id, auditStatus: '1' | '2', auditRemark?: string }
  return request({
    url: "/system/sysUserAuditDetail/auditAvatar",
    method: "post",
    data,
  });
}
