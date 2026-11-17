# After frontend

React 급식 평가 체험 앱입니다. 기존 안내·순위 화면에 실행 환경과 메뉴별 평가 화면을 연결했습니다.

## 실행

Node.js 20.19 이상 또는 22.12 이상에서:

```bash
cd frontend
npm ci
npm run dev
```

터미널에 표시된 주소로 접속하세요. `npm run build`로 배포 파일을 만들고 `npm run preview`로 확인할 수 있습니다. 정적 배포 시 모든 페이지 경로를 `index.html`로 연결하는 SPA fallback 설정이 필요합니다.

## 현재 기능

- 메뉴 목록 → 별점(필수), 태그와 한마디(선택) → 평가 등록 → 인기 순위
- 메뉴별 평가 수정, 새로고침 후 평가 유지, 잘못된 경로 안내
- 순위는 이 브라우저에 저장된 평가의 평균 별점으로 계산

현재 메뉴는 예시이며 데이터는 localStorage에만 저장됩니다. 서버 API, 사용자 인증, 실제 급식 데이터와 여러 사용자의 투표 집계는 연결되지 않았습니다. 같은 브라우저에서는 메뉴별 한 개 평가만 유지하며, 개인정보를 입력하지 마세요.

API 명세가 확정되면 `frontend/src/services/votes.js`의 저장·조회 계층을 서버 요청으로 교체하고 인증 및 중복 투표 정책을 서버에서 검증해야 합니다.

## 검증

```bash
cd frontend
npm test
npm run build
```
