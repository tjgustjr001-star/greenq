export const evaluationStatusLabels = {
  NORMAL: "정상",
  CAUTION: "주의",
  FAIL: "경고",
};

export const actionStatusLabels = {
  OPEN: "미조치",
  IN_PROGRESS: "조치중",
  RESOLVED: "조치완료",
};

export const qualityNcStatusLabels = {
  RECORDED: "기록됨",
  REVIEWED: "검토완료",
  REFLECTED: "리포트 반영",
};

export const statusLabels = {
  ...evaluationStatusLabels,

  ACTIVE: "활성",
  INACTIVE: "비활성",
  MAINTENANCE: "점검",
  PLANNED: "예정",
  GROWING: "재배 중",
  HARVESTED: "수확 완료",
  CLOSED: "종료",

  ...actionStatusLabels,
  ...qualityNcStatusLabels,

  DAILY: "일일",
  WEEKLY: "주간",
  MONTHLY: "월간",
  QUARTERLY: "분기",
  YEARLY: "연간",

  BATCH: "배치",
  ALL: "전체",

  ADMIN: "관리자",
  WORKER: "작업자",
};

export const cropTypeLabels = {
  LEAFY: "엽채류",
  FRUIT: "과채류",
  HERB: "허브류",
  ETC: "기타",
};

export const issueTypeLabels = {
  env: "환경",
  quality: "품질",
};

export const growthStageLabels = {
  GERMINATION: "발아기",
  GROWING: "생육기",
  HARVEST: "수확기",
};

export function labelOf(value) {
  if (value === null || value === undefined || value === "") return "-";
  return statusLabels[value] || cropTypeLabels[value] || issueTypeLabels[value] || growthStageLabels[value] || value;
}

export function issueStatusLabel(issueType, status) {
  if (status === null || status === undefined || status === "") return "-";
  const normalizedType = String(issueType || "").toLowerCase();
  if (normalizedType === "quality") return qualityNcStatusLabels[status] || labelOf(status);
  return actionStatusLabels[status] || labelOf(status);
}
