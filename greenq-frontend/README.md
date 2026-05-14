# GreenQ Frontend v21

React + Vite 기반 GreenQ 프론트엔드 구현 화면입니다.

## v21 반영 사항

### 관리 메뉴 z-index 버그 확정 수정
- 기존 fixed 메뉴가 여전히 테이블 DOM 내부에 남아 있어서 다른 행의 점점점 버튼이 메뉴 위에 보이는 문제가 있었습니다.
- 이번 버전에서는 ActionMenu 드롭다운을 React Portal로 `document.body`에 직접 렌더링합니다.
- 따라서 테이블 행, 카드, 패널의 z-index/overflow/staking context 영향을 받지 않습니다.

### 관리 메뉴 위치
- 메뉴는 항상 클릭한 점점점 버튼 하단에 표시
- 버튼 오른쪽 끝과 메뉴 오른쪽 끝을 맞춤
- 좌우 화면 경계만 보정
- 하단 공간이 부족할 경우 위로 뒤집지 않고 메뉴 내부 스크롤 처리

## 실행 방법

```powershell
cd greenq-frontend-v21
npm install
npm run dev
```

## 로그인 계정

```text
admin / 1111
user / 1111
```

## 확인 추천 URL

```text
/crops
/quality
/environment
/issues
/reports
```
