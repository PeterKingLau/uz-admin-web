import request from "@/utils/request";

export function listContentAudit(query) {
  return request({
    url: "/content/postInfo/list",
    method: "get",
    params: query,
  });
}

export function auditPost(data) {
  return request({
    url: "/content/postInfo/auditPost",
    method: "post",
    data,
  });
}
