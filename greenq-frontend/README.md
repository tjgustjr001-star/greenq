# GreenQ Frontend

React + Vite 기반 GreenQ 식물공장 환경·품질관리 보조 ERP 프론트엔드입니다.

## 실행

```powershell
npm install
npm run dev
```

같은 와이파이의 태블릿에서 QR 시연을 할 때는 노트북 내부 IP로 접속할 수 있도록 실행합니다.

```powershell
npm run dev:host
```

## 태블릿 QR 시연 설정

1. 노트북과 태블릿을 같은 와이파이에 연결합니다.
2. Windows에서 `ipconfig`로 노트북의 IPv4 주소를 확인합니다.
3. 프론트 서버를 실행합니다.

```powershell
npm run dev:host
```

4. 노트북 브라우저에서 `localhost`가 아니라 내부 IP 주소로 접속합니다.

```text
http://192.168.0.123:5173
```

5. 관리자 화면에서 배치 QR을 열고 태블릿으로 스캔합니다.

QR 주소는 기본적으로 관리자가 현재 접속한 프론트 주소를 기준으로 생성됩니다. 따라서 브라우저에서 `http://192.168.0.123:5173`으로 접속했다면 QR도 `http://192.168.0.123:5173/scan/batch/...` 형태가 됩니다.

주소를 고정해야 하는 시연 환경에서는 `greenq-frontend/.env.local`에 다음 값을 설정할 수 있습니다.

```env
VITE_PUBLIC_APP_URL=http://192.168.0.123:5173
VITE_API_BASE_URL=http://192.168.0.123:8080/api
```

`VITE_PUBLIC_APP_URL`이 설정되어 있으면 현재 접속 주소보다 이 값을 우선 사용합니다. 설정하지 않으면 `window.location.origin`을 사용합니다. `localhost`로 접속한 상태에서는 QR도 `localhost`로 생성되므로 태블릿 시연에서는 내부 IP 주소로 접속해야 합니다.

`VITE_API_BASE_URL`은 태블릿 브라우저가 호출할 백엔드 API 주소입니다. 태블릿에서 `localhost`는 노트북이 아니므로 이 값도 노트북 내부 IP로 설정해야 합니다.

## 주요 화면

```text
/dashboard
/environment
/quality
/issues
/reports
```
