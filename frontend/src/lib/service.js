import { createClient } from "./api";
import { createDemo } from "./demo";
export const demoMode = import.meta.env.VITE_DATA_MODE !== "api";
export const service = demoMode
  ? createDemo()
  : createClient(import.meta.env.VITE_API_BASE_URL || "/api/v1");
export const categories = {
  SUBJECT: "교과",
  ARTS_PE: "예체능",
  CAREER: "진로",
  IT: "IT",
  ETC: "기타",
};
export const statuses = {
  DRAFT: "작성중",
  SUBMITTED: "제출됨",
  REVIEWING: "심사중",
  SURVEYING: "수요조사중",
  VOTING: "일정투표중",
  CONFIRMED: "개설확정",
  ENROLLING: "수강신청중",
  RUNNING: "운영중",
  CLOSED: "폐강",
  REJECTED: "반려",
  BELOW_THRESHOLD: "임계치미달",
  ON_HOLD: "보류",
  ARCHIVED: "보관",
};
