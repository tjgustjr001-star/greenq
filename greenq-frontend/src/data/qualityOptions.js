export const LEAF_COLOR_OPTIONS = [
  { value: "", label: "선택" },
  { value: "진녹색", label: "진녹색" },
  { value: "녹색", label: "녹색" },
  { value: "연녹색", label: "연녹색" },
  { value: "황화", label: "황화" },
  { value: "갈변", label: "갈변" },
  { value: "반점", label: "반점" },
  { value: "기타", label: "기타" },
];

export const GROWTH_STAGE_OPTIONS = [
  { value: "", label: "선택" },
  { value: "GERMINATION", label: "발아기" },
  { value: "SEEDLING", label: "육묘기" },
  { value: "TRANSPLANTING", label: "정식기" },
  { value: "ROOTING", label: "활착기" },
  { value: "GROWING", label: "생육기" },
  { value: "HARVEST", label: "수확기" },
  { value: "END", label: "종료" },
  { value: "ETC", label: "기타" },
];

export function optionLabel(options, value) {
  if (value === null || value === undefined || value === "") return "-";
  const text = String(value).trim();
  return options.find((option) => option.value === text)?.label || text;
}

export function leafColorLabelOf(value) {
  return optionLabel(LEAF_COLOR_OPTIONS, value);
}

export function growthStageLabelOf(value) {
  return optionLabel(GROWTH_STAGE_OPTIONS, value);
}
