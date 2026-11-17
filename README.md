# After — 우리가 만드는 방과후

방과후 수업을 찾아 관심을 표시하고, 후보 시간별 참여 가능 여부를 투표하는 React 프런트엔드입니다. 급식 평가 구현은 제거했습니다.

## Windows / macOS / Linux 실행

Node.js 20.19 이상 또는 22.12 이상이 필요합니다.

```bash
git clone https://github.com/After2026/After-fe.git
cd After-fe
# 이번 구현 브랜치
git switch feature/after-voting-platform
cd frontend
npm ci
npm run dev
```

이미 클론했다면 저장소 루트에서 `git fetch origin`, `git switch feature/after-voting-platform`, `git pull --ff-only` 후 `frontend`에서 실행하세요. 터미널에 표시되는 주소(기본 http://localhost:5173)로 접속합니다.

## 기능

- 수업 제안 목록: 검색, 상태·학년·분류 필터, 관심 인원·최신·마감 순 정렬, 커서 더 보기
- 제안 상세: 대상 학년, 개설 목표, 참여 의향 1~3과 의견 등록·변경·취소
- 일정 투표: 후보 시간별 가능 / 조정 가능 / 불가능, 모든 슬롯 응답 검증, 자격·마감 확인, 기간 내 재응답
- 결과: 시간별 응답 인원 표, 새로고침, 내 투표 수정
- 수업 제안 임시저장, 내 관심·제안 목록, 이용 안내, 잘못된 경로 처리
- API 모드 로그인·승인대기 회원가입, 쿠키 기반 인증 및 토큰 만료 시 재발급

## 체험 모드와 API 모드

기본은 **체험 모드**입니다. 예시 수업과 본인 응답만 이 브라우저의 localStorage에 저장합니다. 농구 수업에는 체험용 의향 2가 설정되어 바로 시간 투표를 해볼 수 있습니다. 예시 관심 인원은 고정된 샘플 수치이며, 결과는 이 브라우저에서 제출한 1명의 응답만 집계합니다. 비밀번호는 브라우저에 저장하지 않습니다. 다른 사용자와 공유하거나 실제 학교 투표를 진행하는 서버는 포함되어 있지 않습니다.

`frontend/.env.example`을 `frontend/.env.local`로 복사해 다음과 같이 설정하면 실제 API를 요청합니다.

```dotenv
VITE_DATA_MODE=api
VITE_API_BASE_URL=https://YOUR_API_HOST/api/v1
```

변경 후 개발 서버를 재시작하세요. API 오류 시 체험 데이터로 대체하거나 저장 성공을 표시하지 않습니다. 인증은 `credentials: include`이며 Authorization 헤더를 사용하지 않습니다. 서버의 HTTPS, CORS origin 허용 및 쿠키 정책을 프런트엔드 배포 도메인에 맞춰 설정해야 합니다. 같은 도메인에서 `/api/v1`을 서버로 프록시하는 구성을 권장합니다.

## 연동 범위와 미확정 사항

첨부 API 초안에는 경로·권한·공통 규약만 있으며 상세 요청·응답 JSON은 없습니다. 구현이 가정한 필드는 [API 계약 문서](docs/API-CONTRACT.md)를 참고하세요. **실제 서버 연결 검증은 서버 주소와 확정 JSON을 받은 뒤 가능합니다.** 디자인 링크는 접근 차단으로 확인하지 못했으며, 현재 UI는 새로 구성한 화면입니다.

이번 구현은 학생의 관심 표시·일정 투표 흐름을 중심으로 합니다. 공동제안 초대·동의·최종 제출, 교사 의견, 관리자 검토·슬롯 설정·최종 결정, 수강신청, 알림·계정 관리 화면은 아직 구현하지 않았습니다. 임시저장한 제안이 자동으로 수요조사·투표 상태로 바뀌지는 않습니다.

## 검증 / 배포

```bash
cd frontend
npm test
npm run build
npm run preview
```

`dist`를 정적 배포하고 모든 프런트엔드 경로를 `index.html`로 연결하세요. `/api/v1`은 SPA fallback 대상에서 제외하세요. 테스트는 투표 자격·마감·전체 슬롯 검증, 재응답, 저장 유지, API 쿠키 인증·재발급 및 오류 처리를 확인합니다.
