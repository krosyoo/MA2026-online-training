# Vercel 배포 가이드

이 프로젝트는 **Vercel 한 곳에서** 프론트엔드, API, 데이터베이스가 모두 동작하도록 구성되어
있습니다. 외부 서비스에 따로 가입할 필요가 없습니다.

- 화면(React)은 빌드된 정적 파일로 Vercel CDN이 서빙합니다.
- API(Express)는 `api/[...path].ts` 서버리스 함수 하나로 동작합니다.
- 데이터베이스는 Vercel Marketplace에서 만든 Postgres를 사용합니다. 결제와 접속 정보가
  모두 Vercel 프로젝트에 통합됩니다.

---

## 1. 프로젝트 연결

Vercel 대시보드에서 **Add New → Project** 로 이 저장소를 가져옵니다.
빌드 설정은 `vercel.json`에 이미 들어 있으므로 그대로 두면 됩니다.

## 2. 데이터베이스 만들기

프로젝트의 **Storage → Create Database → Postgres (Neon)** 를 선택해 생성합니다.
생성이 끝나면 `DATABASE_URL`이 프로젝트 환경변수에 자동으로 주입됩니다.

## 3. 환경변수 설정

**Settings → Environment Variables** 에서 다음을 추가합니다.

| 이름 | 필수 | 설명 |
|---|---|---|
| `DATABASE_URL` | ✅ | 2단계에서 자동 주입됨. 직접 넣을 필요 없음 |
| `SESSION_SECRET` | ✅ | 로그인 쿠키 서명 키. **32자 이상**. `openssl rand -base64 32` |
| `SEED_SECRET` | 최초 1회 | 초기 데이터 주입용. 작업이 끝나면 삭제 권장 |
| `ADMIN_EMAIL` | 최초 1회 | 첫 관리자 계정 이메일 |
| `ADMIN_PASSWORD` | 최초 1회 | 첫 관리자 비밀번호 (6자 이상) |
| `ADMIN_NAME` | 선택 | 관리자 표시 이름 (기본값 "관리자") |

> `SESSION_SECRET`이 없으면 로그인·회원가입이 500 오류를 반환합니다. 가장 먼저 넣어주세요.

## 4. 테이블 생성

로컬에서 한 번만 실행합니다.

```bash
npm install
npx vercel env pull .env     # Vercel의 환경변수를 .env로 내려받음
npm run db:push              # 테이블 생성
```

## 5. 초기 데이터 주입

두 가지 방법 중 하나를 쓰면 됩니다.

**방법 A — 로컬에서 (권장)**

```bash
npm run db:seed
```

**방법 B — 브라우저/터미널에서 배포된 사이트에 직접 요청**

```bash
curl -X POST https://<your-project>.vercel.app/api/seed \
  -H "x-seed-secret: $SEED_SECRET"
```

두 방법 모두 커리큘럼 4개 학기 · 16개 강의 · 28권의 도서를 넣고, `ADMIN_EMAIL`/
`ADMIN_PASSWORD`가 설정되어 있으면 관리자 계정을 만듭니다.

이미 데이터가 있으면 아무 것도 하지 않으므로 여러 번 실행해도 안전합니다.
작업이 끝나면 `SEED_SECRET`, `ADMIN_PASSWORD` 환경변수는 지우는 것을 권장합니다.

## 6. 확인

먼저 상태 점검 엔드포인트를 봅니다. 설정이 덜 끝난 상태에서도 항상 응답하며, 무엇이
빠졌는지 알려줍니다.

```
https://<your-project>.vercel.app/api/health
→ {"ok":true,"database":true,"sessionSecret":true}
```

`database` 또는 `sessionSecret`이 `false`면 해당 환경변수를 넣고 재배포하세요.
설정이 빠진 상태에서 API를 호출하면 503과 함께 어떤 변수가 없는지 알려줍니다.

- 홈에서 4개 학기가 보이면 DB 연결 성공
- `ADMIN_EMAIL` 계정으로 로그인 후 `/admin` 접속 → 강의 정보 수정 후 저장 → 새로고침해도
  값이 유지되면 정상

---

## 로컬 개발

```bash
cp .env.example .env         # DATABASE_URL, SESSION_SECRET 채우기
npm install
npm run db:push
npm run db:seed
npm run dev                  # http://localhost:5000
```

로컬에서는 Express가 API와 화면을 함께 서빙합니다(`server/index.ts`). Vercel에서는 이
파일을 쓰지 않고 `api/[...path].ts`가 같은 앱을 서버리스로 실행합니다.

`DATABASE_URL`이 Neon 주소면 Neon HTTP 드라이버를, 그 외 Postgres면 node-postgres를
자동으로 사용합니다(`server/db.ts`). 로컬에 설치한 Postgres를 그대로 붙여도 됩니다.

---

## API

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/api/health` | 공개 | 상태 확인 |
| GET | `/api/semesters` | 공개 | 전체 커리큘럼 |
| PUT | `/api/semesters` | 관리자 | 학기·강의·도서 정보 수정 (기존 항목만, 생성/삭제는 아래 참조) |
| POST | `/api/admin/semesters` | 관리자 | 학기 추가 |
| DELETE | `/api/admin/semesters/:id` | 관리자 | 학기 삭제 (수강신청이 있으면 409, `?force=true`로 재확인) |
| POST | `/api/admin/semesters/:id/courses` | 관리자 | 해당 학기에 강의 추가 |
| DELETE | `/api/admin/courses/:id` | 관리자 | 강의 삭제 (수강신청이 있으면 409, `?force=true`로 재확인) |
| GET | `/api/admin/users` | 관리자 | 사용자 목록 (역할·수강 건수 포함) |
| POST | `/api/admin/users/:id/reset-password` | 관리자 | 임시 비밀번호 발급 (응답에 1회만 포함) |
| PATCH | `/api/admin/users/:id` | 관리자 | 역할 변경 (마지막 관리자 강등은 409) |
| DELETE | `/api/admin/users/:id` | 관리자 | 사용자 삭제 (본인·마지막 관리자는 409) |
| POST | `/api/auth/signup` | 공개 (IP 제한) | 회원가입 |
| POST | `/api/auth/login` | 공개 (IP 제한) | 로그인 |
| POST | `/api/auth/logout` | 공개 | 로그아웃 |
| POST | `/api/auth/change-password` | 로그인 | 본인 비밀번호 변경 (현재 비밀번호 확인 필수) |
| GET | `/api/auth/me` | 로그인 | 현재 사용자 + 수강 목록 |
| POST | `/api/enrollments` | 로그인 | 수강 신청 |
| PATCH | `/api/enrollments/:courseId` | 로그인 | 완료 여부 변경 (`{"completed": true\|false}`) |
| DELETE | `/api/enrollments/:courseId` | 로그인 | 수강 취소 |
| POST | `/api/seed` | `SEED_SECRET` | 최초 데이터 주입 |

인증은 httpOnly 쿠키에 담긴 JWT를 사용합니다. 서버리스 환경에서는 메모리 세션을 쓸 수
없기 때문입니다. 비밀번호는 scrypt로 해시되어 저장되며 API 응답에 절대 포함되지 않습니다.

관리자 권한은 요청마다 DB에서 다시 확인하므로, 계정 권한을 내리면 기존 로그인 쿠키로도
관리자 기능을 쓸 수 없습니다.

### 로그인 보호

- **계정 잠금**: 같은 계정에 5회 연속 비밀번호 오류 시 15분간 잠깁니다 (`users.failed_attempts`/`locked_until`).
- **IP 제한**: `/api/auth/login`은 IP당 10분에 20회, `/api/auth/signup`은 IP당 1시간에 8회로
  제한됩니다 (`rate_limits` 테이블).
- 관리자가 비밀번호를 재설정하면 잠금도 함께 풀립니다.

### 세션 무효화

로그인 쿠키(JWT)에는 계정의 `tokenVersion`이 들어 있고, 매 요청마다 DB 값과 대조합니다.
비밀번호 변경·관리자 재설정·역할 변경 시 이 값이 올라가므로 **기존에 발급된 쿠키가 즉시
무효화**됩니다. 계정이 탈취됐을 때 비밀번호만 바꿔서는 공격자가 쿠키 만료(7일)까지 계속
접근할 수 있는 문제를 막기 위한 장치입니다.

본인이 비밀번호를 바꾸면 **다른 기기의 세션만 끊기고 현재 창은 유지**됩니다.

### 비밀번호를 잊은 사용자

이메일 발송 기능이 없으므로(외부 서비스 없이 Vercel만 사용하는 구성), 학생이 비밀번호를
잊으면 **관리자가 직접 재설정**합니다. `/admin` 페이지의 "사용자 관리"에서 "비밀번호 재설정"을
누르면 임시 비밀번호가 화면에 한 번만 표시됩니다 — 이 값은 저장되지 않으므로 그 자리에서
학생에게 안전한 방법(문자, 카카오톡 등)으로 전달해야 합니다.

임시 비밀번호로 로그인하면 헤더와 `/profile` 화면에 경고가 표시되며, 학생이 직접 비밀번호를
바꾸면 경고가 사라집니다. 본인 비밀번호 변경은 `/profile` 페이지에서 합니다.

### 관리자 권한을 잃었을 때

`ADMIN_EMAIL`/`ADMIN_PASSWORD`를 설정하고 `npm run db:seed`를 다시 실행하면, 해당 이메일의
기존 계정을 **관리자로 승격하고 비밀번호를 재설정**합니다. 계정이 없으면 새로 만듭니다.
DB를 직접 수정하지 않고 관리자 접근을 복구하는 경로입니다.

마지막 관리자는 스스로를 강등하거나 삭제할 수 없습니다(409). 관리자를 교체하려면 새 관리자를
먼저 지정한 뒤 기존 관리자를 강등하세요.
