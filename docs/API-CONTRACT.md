# API 연동 계약 (미확정 필드 포함)

첨부 `API명세서` HTML 및 CSV를 기준으로 작성했습니다. 첨부 자체가 초안이며 상세 입력·출력 필드는 비어 있습니다. 아래 JSON은 **프런트엔드가 가정한 계약**이며 백엔드 확정 스키마가 아닙니다. 서버 주소도 제공되지 않았으므로 실제 서버와의 호환성을 검증하지 않았습니다.

## 확인된 공통 규약

- `/api/v1` 기본 경로, JSON, 정수 ID, ISO 8601 시간
- HttpOnly 쿠키 인증, `credentials: include`, Authorization 헤더 없음
- `TOKEN_EXPIRED`인 401에서 `POST /auth/refresh` 후 원 요청 1회 재시도
- 목록 `{ items, nextCursor }`, 오류 `{ error: { code, message, details } }`
- intentLevel: 1 반드시 신청, 2 시간이 맞으면 신청, 3 관심만
- availability: AVAILABLE / ADJUSTABLE / UNAVAILABLE
- 선생님이 직접 시작한 일정 투표는 대상 학년 전체가 기간 내 참여·재응답할 수 있습니다. 이전 수요조사에서 시작한 투표에는 기존 참여 의향 요건을 적용합니다.

## 사용 경로와 가정한 JSON

| API | 요청 / 응답 가정 |
| --- | --- |
| GET /users/me | `{id,name,grade,role,status}` |
| POST /auth/login | `{username,password,rememberMe}` → 쿠키 발급 |
| POST /auth/signup | `{username,password,name,studentNumber,signupCode}` → 승인대기 접수 |
| POST /auth/logout | 본문 없음 |
| POST /auth/refresh | 본문 없음 |
| GET /proposals | query: `q,category,status,grade,sort,cursor,limit`; sort: interest/latest/deadline → `{items: Proposal[],nextCursor}` |
| GET /proposals/{id} | `Proposal & {myInterest: {intentLevel,comment} | null}` |
| PUT /proposals/{id} | 작성자가 일정 투표 시작 전 임시저장·제출·수요조사 중인 제안을 수정합니다. 제안 상세의 `canEdit`은 로그인한 사용자 기준입니다. |
| DELETE /proposals/{id} | 작성자가 투표 시작 전 제안을 철회합니다. `ARCHIVED`로 보관하며 학생·교사 목록에서 제외합니다. `canDelete`로 삭제 버튼 표시 여부를 판단합니다. |
| POST /proposals | `{title,description,category,targetGrades,instructorType}` → `Proposal` (DRAFT) |
| PUT /proposals/{id}/interest | `{intentLevel,comment}` |
| DELETE /proposals/{id}/interest | 본문 없음 |
| GET /proposals/{id}/vote | `{slots:Slot[],deadline,canVote,responses:Response[]}` |
| PUT /proposals/{id}/vote | `{responses:Response[]}` |
| GET /proposals/{id}/vote/result | `{totalRespondents,slots:(Slot & {availableCount,adjustableCount,unavailableCount})[]}` |
| GET /users/me/interests | `{items:Proposal[]}` |
| GET /users/me/proposals | `{items:Proposal[]}` |

```ts
type Proposal = {
  id: number; title: string; description: string;
  category: 'SUBJECT' | 'ARTS_PE' | 'CAREER' | 'IT' | 'ETC';
  targetGrades: number[]; status: string;
  interestCount: number; threshold: number; proposerName: string;
  surveyDeadline?: string; voteDeadline?: string; icon?: string;
};
type Slot = { id: number; day: string; period: number };
type Response = { slotId: number; availability: 'AVAILABLE' | 'ADJUSTABLE' | 'UNAVAILABLE' };
```

화면은 후보별 응답 인원을 표시합니다. 교사 수락으로 시작한 투표는 마감 후 담당 선생님이 운영 시간을 선택합니다.

## 학교 선생님의 제안 수락과 개설 확정

| API | 연동 방식 |
| --- | --- |
| `POST /proposals` | 새 제안 화면은 `publishForSurvey: true`를 보내 즉시 `SURVEYING`으로 공개합니다. 응답의 `awaitingTeacher: true`는 선생님 수락 전까지 관심을 받을 수 있음을 뜻합니다. |
| `POST /proposals/{id}/submit` | 기존 임시저장 제안은 이 경로로 제출합니다. 서버가 작성자와 접수 기간을 검증합니다. |
| `GET /teacher/proposals` | 교사가 수락할 수 있는 수요조사 중 제안과 기존 제출 제안, 본인 담당 제안을 조회합니다. |
| `GET /time-slots` | 학교에서 사용하는 월요일·수요일 운영 후보를 조회합니다. |
| `POST /teacher/proposals/{id}/accept` | `{timeSlotIds, voteEndAt}`을 받아 담당 선생님과 후보를 저장하고 즉시 `VOTING`으로 전환합니다. |
| `POST /teacher/proposals/{id}/close-vote` | 담당 선생님이 진행 중인 투표를 즉시 마감합니다. 기존 응답을 유지하고 `REVIEWING`으로 전환합니다. |
| `GET /proposals/votable` | 로그인한 학생에게 현재 참여할 수 있는 투표를 반환합니다. |
| `POST /teacher/proposals/{id}/confirm` | `{timeSlotId}`를 받아 마감 후 담당 선생님이 투표 후보 중 하나로 개설을 확정합니다. |

수락과 개설 확정은 `TEACHER` 역할로 제한합니다. 선생님 수락 즉시 수요조사를 닫고 일정을 투표에 부칩니다. 최소 관심 인원 조건은 없고 대상 학년 학생 전체가 투표할 수 있습니다. 투표 응답의 `requiresInterest: false`로 이 흐름을 구분하며, 이전 방식의 투표에는 기존 관심 표시 요건을 유지합니다.

새 제안의 `interestCount`는 0에서 시작합니다. `PUT /proposals/{id}/interest`는 작성자 본인의 요청을 거절합니다. 관심 인원, 참여 의향별 수치와 유효 수요는 다른 학생의 실제 응답으로 계산합니다.

## 후속 확정 사항

실제 API 호스트, CORS/쿠키 도메인, 각 경로의 JSON 및 필드 제약, 검색·정렬 파라미터 이름, 슬롯 요일·교시 형식, 학년별 제한 및 잔여 관심 횟수, 관리자/교사 워크플로, 임시저장 제안 제출, 디자인 원본이 필요합니다. 필드가 달라지면 `src/lib/api.js`에서 서버 JSON을 이 계약으로 변환하도록 수정하면 됩니다.


## 첨부 디자인 반영 시 추가한 계약 가정

- `GET /auth/username-check?username=...` → `{available:boolean}`
- `GET /enrollments/courses` → `{items:(Proposal & {capacity,enrollmentCount,canEnroll,enrollmentDeadline,instructorName?:string,courseTime?:string})[]}`. 개설 확정 수업 목록은 담당 선생님(`instructorName`), 운영 시간(`courseTime`), 수업 설명(`description`)을 표시합니다. 강좌는 신청일 전후에도 조회할 수 있어야 합니다.
- `GET /users/me/enrollments` → `{items:{id,proposalId,title}[]}`
- `POST /enrollments` 본문 `{proposalId}` → `{id,proposalId,title}`
- `DELETE /enrollments/{enrollmentId}` → 204 또는 JSON
- `GET /admin/proposals` → `{items:Proposal[]}`
- `GET /admin/proposals/{id}/review` → `{proposal:Proposal,teacherOpinion:{comment}|null,similarProposals:Proposal[]}`
- `POST /admin/proposals/{id}/review` 본문 `{action,threshold,surveyDeadline,reason}`. action은 `APPROVE / REQUEST_CHANGES / REJECT`를 가정합니다. 보류는 명세의 `POST /admin/proposals/{id}/hold`에 `{reason}`을 전송합니다.
- `POST /proposals/similar-check` 본문 `{title}` → `{items:Proposal[]}`
- 제안 작성은 디자인에 맞춰 `activityPlan,capacity,instructorName,referenceUrl` 필드를 추가했습니다.
- 회원가입에 `grade,classNumber,email,termsAgreed,privacyAgreed,notificationConsent`를 추가했습니다. 실제 서버의 정책 및 스키마 확정 필요.

체험 수강신청은 지정한 날짜의 한국 시간 하루 동안 개설 확정 수업을 신청할 수 있고 중복·최대 2개 제한을 확인합니다. 실제 API도 같은 학교 일정을 설정하고 서버 시계로 `POST /enrollments`와 `DELETE /enrollments/{enrollmentId}`의 신청 가능 시간을 검증해야 합니다. 실제 정원·우선권·시간 충돌·동시 신청도 서버에서 검증해야 합니다. 관리자 체험은 명시적으로 표시하며 실제 API 모드에서는 역할을 확인합니다.


## 개설 알림 연결

명세의 NTF-01~04 경로를 사용합니다. 실제 JSON은 아래 형태를 가정하며 실서버 확인이 필요합니다.

- `GET /notifications?limit=20&cursor=...` → `{items:Notification[],nextCursor:string|null}`
- `GET /notifications/unread-count` → `{count:number}`
- `PATCH /notifications/{notificationId}/read` → 성공 응답 또는 204
- `POST /notifications/read-all` → 성공 응답 또는 204
- Notification: `{id,proposalId,title,message,read,createdAt}`. 알림의 수업 연결은 정수 proposalId로 프런트엔드 경로를 구성합니다.

실제 개설 알림 생성은 서버의 개설 확정/수강신청 시작 이벤트에서 관심 학생별로 수행해야 합니다. 프런트엔드는 30초 간격·포커스 복귀 시 조회하며, 서버 알림을 임의 생성하지 않습니다. 체험 모드에서만 브라우저 내 관심 강좌의 저장된 상태로 개설 알림을 생성하고 중복을 제거합니다. Web Push 구독/권한 요청/발송은 구현하지 않았습니다.
