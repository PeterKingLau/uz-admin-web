export const POST_TYPE = {
  TEXT: "1",
  IMAGE: "2",
  VIDEO: "3",
};

export const AUDIT_STATUS = {
  PENDING: "0",
  APPROVED: "1",
  REJECTED: "2",
};

export const CONTENT_STATUS = {
  NORMAL: "0",
  DELETED: "1",
};

export const PROFILE_APPLY_TYPE = {
  AVATAR: "avatar",
  NICK_NAME: "nick_name",
  SIGNATURE: "signature",
};

export const AUDIT_MEDIA_MODE = {
  CELL: "cell",
  DETAIL: "detail",
};

export const ENUM_TAG_CONFIG = {
  POST_TYPE: {
    [POST_TYPE.TEXT]: { label: "文字", type: "info" },
    [POST_TYPE.IMAGE]: { label: "图片", type: "success" },
    [POST_TYPE.VIDEO]: { label: "视频", type: "warning" },
  },

  AUDIT_STATUS: {
    [AUDIT_STATUS.PENDING]: { label: "待审核", type: "warning" },
    [AUDIT_STATUS.APPROVED]: { label: "通过", type: "success" },
    [AUDIT_STATUS.REJECTED]: { label: "驳回", type: "danger" },
  },

  CONTENT_STATUS: {
    [CONTENT_STATUS.NORMAL]: { label: "正常", type: "success" },
    [CONTENT_STATUS.DELETED]: { label: "删除", type: "info" },
  },

  PROFILE_APPLY_TYPE: {
    avatar: { label: "头像", type: "warning" },
    nick_name: { label: "昵称", type: "success" },
    signature: { label: "个性签名", type: "info" },
  },
};

export default {
  POST_TYPE,
  AUDIT_STATUS,
  CONTENT_STATUS,
  PROFILE_APPLY_TYPE,
  AUDIT_MEDIA_MODE,
  ENUM_TAG_CONFIG,
};
