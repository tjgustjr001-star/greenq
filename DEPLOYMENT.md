# GreenQ Deployment Guide

GreenQ is a plant-factory environment and quality management web project.

- Frontend: `greenq-frontend` on Vercel
- Backend: `greenq-backend` on Railway
- Database: Railway MariaDB/MySQL-compatible database

This guide keeps local development and production deployment separate. Do not commit real passwords or API secrets.

## Project Structure

```text
greenq/
  greenq-frontend/   React + Vite
  greenq-backend/    Spring Boot + JPA/Hibernate
```

Frontend package file:

```text
greenq-frontend/package.json
```

Backend build file:

```text
greenq-backend/build.gradle
```

## Local Run

Backend:

```bash
cd greenq-backend
set DB_HOST=localhost
set DB_PORT=3307
set DB_NAME=greenq
set DB_USERNAME=testuser
set DB_PASSWORD=<local-db-password>
gradlew.bat bootRun
```

The local backend defaults to port `8081`.

Frontend:

```bash
cd greenq-frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Database Setup

Run the SQL files intentionally. The application does not auto-run schema or dummy data at startup.

```text
greenq-backend/src/main/resources/db/greenq_schema_v1_0_3.sql
greenq-backend/src/main/resources/db/greenq_dummy_data_v1_0_3.sql
```

Use the dummy data only for portfolio/demo environments.

## Vercel Settings

Project root:

```text
greenq-frontend
```

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

Environment variables:

```text
VITE_API_BASE_URL=https://<railway-backend-domain>/api
VITE_PUBLIC_APP_URL=https://<vercel-frontend-domain>
```

`greenq-frontend/vercel.json` rewrites all SPA routes to `index.html`, so routes such as `/dashboard` and `/reports/1` can be opened directly.

## Railway Settings

Project root:

```text
greenq-backend
```

Build command:

```text
./gradlew build
```

Start command:

```text
java -Dspring.profiles.active=prod -jar build/libs/greenq-backend.jar
```

Railway can also use the included `Procfile`.

Environment variables:

```text
SPRING_PROFILES_ACTIVE=prod
DB_HOST=<database-host>
DB_PORT=<database-port>
DB_NAME=<database-name>
DB_USERNAME=<database-user>
DB_PASSWORD=<database-password>
CORS_ALLOWED_ORIGINS=https://<vercel-frontend-domain>
```

Railway provides `PORT` automatically. The production profile uses `server.port=${PORT:8080}`.

If Railway provides a complete JDBC URL and you prefer to use it directly:

```text
DB_URL=jdbc:mariadb://<host>:<port>/<database>?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=Asia/Seoul
```

For MySQL instead of MariaDB, set:

```text
DB_URL=jdbc:mysql://<host>:<port>/<database>?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
DB_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver
```

`JPA_DDL_AUTO` defaults to `none` to avoid unintended schema changes. For a temporary deployment smoke test only, `JPA_DDL_AUTO=update` can be used carefully.

## CORS Order

1. Deploy the Railway backend.
2. Deploy the Vercel frontend.
3. Copy the final Vercel domain.
4. Set Railway `CORS_ALLOWED_ORIGINS` to that exact origin.
5. Redeploy the Railway backend.

Example:

```text
CORS_ALLOWED_ORIGINS=https://greenq.vercel.app
```

Do not add a trailing slash.

## Deployment Checklist

- Vercel frontend opens.
- `GET <railway-backend>/api/health` responds.
- Login page sends `OPTIONS /api/auth/login` successfully.
- `POST /api/auth/login` is called after preflight.
- Dashboard API loads after login.
- Environment monitoring API loads.
- Quality entry page loads and can save test data.
- QR URL uses `VITE_PUBLIC_APP_URL` or the current frontend origin, not localhost.
- CORS errors are not shown in DevTools.
- Railway database contains schema and demo data.
- If file/image upload is added later, storage path and persistence must be configured separately. The current project does not define a production upload storage layer.

## Manual Items

- Create Railway database and import schema/demo SQL.
- Set all Railway variables with real values.
- Set all Vercel variables with real deployed URLs.
- Change demo account passwords or restrict sharing before exposing a public portfolio URL.
