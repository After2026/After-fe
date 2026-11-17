# API 연동 계약 (미확정 필드 포함)

첨부 `API명세서` HTML 및 CSV를 기준으로 작성했습니다. 첨부 자체가 초안이며 상세 입력·출력 필드는 비어 있습니다. 아래 JSON은 **프런트엔드가 가정한 계약**이며 백엔드 확정 스키마가 아닙니다. 서버 주소도 제공되지 않았으므로 실제 서버와의 호환성을 검증하지 않았습니다.

## 확인된 공통 규약

- `/api/v1` 기본 경로, JSON, 정수 ID, ISO 8601 시간
- HttpOnly 쿠키 인증, `credentials: include`, Authorization 헤더 없음
- `TOKEN_EXPIRED`인 401에서 `POST /auth/refresh` 후 원 요청 1회 재시도
- 목록 `{ items, nextCursor }`, 오류 `{ error: { code, message, details } }`
- intentLevel: 1 반드시 신청, 2 시간이 맞으면 신청, 3 관심만
- availability: AVAILABLE / ADJUSTABLE / UNAVAILABLE
- 일정 투표는 의향 1·2 학생만, 기간 내 재응답 가능; 서버에서 최종 검증 필요

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

결과 점수의 가중치·동점 규칙은 첨부에 구체적으로 없으므로 임의 점수나 최종 선정 추천은 만들지 않습니다. 응답 인원만 표시하며 최종 결정은 관리자에게 있음을 안내합니다.

## 후속 확정 사항

실제 API 호스트, CORS/쿠키 도메인, 각 경로의 JSON 및 필드 제약, 검색·정렬 파라미터 이름, 슬롯 요일·교시 형식, 학년별 제한 및 잔여 관심 횟수, 관리자/교사 워크플로, 공동제안 초대·제출, 디자인 원본이 필요합니다. 필드가 달라지면 `src/lib/api.js`에서 서버 JSON을 이 계약으로 변환하도록 수정하면 됩니다.
