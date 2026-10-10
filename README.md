# ATR Travel Ops

여행사 실무자를 위한 GDS 엔트리, PNR·운임규정 분석, CRM, 여권·APIS, 견적서, 매출·매입 장부 자동화 서비스입니다.

## 구독 구조

- Google 간편 로그인 회원마다 핵심 자동화 10회 무료
- Pro 월 9,900원(VAT 포함)
- Toss Payments 자동결제 카드 등록 후 첫 달 결제
- 다음 결제일 기준 월 갱신 API 제공
- 여권·고객 데이터와 결제 비밀키는 브라우저 번들에 넣지 않음

## 서버 환경변수

`.env.example`에는 키 이름만 있습니다. 실제 값은 Sites 런타임 환경변수에 등록하고 GitHub에 커밋하지 않습니다.

- `GOOGLE_CLIENT_ID`: Google Identity Services 웹 클라이언트 ID
- `TOSS_CLIENT_KEY`: 자동결제(빌링) 계약 상점의 클라이언트 키
- `TOSS_SECRET_KEY`: Toss 서버 API 시크릿 키
- `SESSION_SECRET`: 로그인 세션 서명용 긴 임의 문자열
- `BILLING_ENCRYPTION_KEY`: 빌링키 암호화용 32바이트 키의 Base64 값
- `RENEWAL_SECRET`: 월 갱신 API 호출용 긴 임의 문자열

Google Cloud의 승인된 JavaScript 원본에는 `https://ops.lineuplounge.co.kr`을 등록합니다. Toss의 클라이언트 키와 시크릿 키는 같은 MID와 같은 테스트/라이브 환경의 키를 사용해야 합니다.

## 개발 및 검증

```bash
npm ci
npm run db:generate
npm run build
node --test tests/ops-core.test.cjs tests/subscription-core.test.cjs
```

Sites 배포 시 `.openai/hosting.json`의 `DB` 바인딩으로 D1이 연결되고 `drizzle/` 마이그레이션이 적용됩니다.
