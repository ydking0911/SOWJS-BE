# SOWJS.KR API 명세서

> **Base URL**: `http://localhost:4000/api` (개발) / `https://api.sowjs.kr/api` (프로덕션)
>
> **Swagger UI**: `http://localhost:4000/docs` (개발 환경에서 인터랙티브 테스트 가능)
>
> **Content-Type**: `application/json`

---

## 공통 응답 형식

모든 API는 아래 형식으로 응답합니다.

```json
// 성공
{ "success": true, "data": { ... } }

// 실패
{ "success": false, "error": "에러 메시지" }
```

---

## 1. Health Check

### `GET /api/health`

서버 및 의존성(Redis, AI 엔진) 상태를 확인합니다.

**응답 예시**
```json
{
  "status": "ok",
  "timestamp": "2026-02-18T09:48:00.000Z",
  "uptime": 3600.5,
  "dependencies": {
    "redis": "ok",
    "aiEngine": "ok"
  }
}
```

---

## 2. Summoner (소환사)

### `GET /api/summoner/:name`

소환사명으로 프로필, 랭크, 최근 전적 통계를 조회합니다.

- **캐시**: Redis 1시간
- **에러**: 소환사 없음 → `404`

**파라미터**

| 이름 | 위치 | 타입 | 필수 | 설명 |
|------|------|------|------|------|
| `name` | path | string | ✅ | 소환사명 (URL 인코딩 필요) |

**요청 예시**
```
GET /api/summoner/%ED%8E%98%EC%9D%B4%EC%BB%A4
```

**응답 예시 (200)**
```json
{
  "success": true,
  "data": {
    "puuid": "abc123...",
    "summonerName": "페이커",
    "summonerLevel": 500,
    "profileIconId": 4567,
    "tier": "CHALLENGER",
    "rank": "I",
    "lp": 1200,
    "wins": 350,
    "losses": 200,
    "winRate": 0.636,
    "stats": {
      "avgKda": 4.2,
      "avgCsPerMin": 8.5,
      "avgVisionScore": 32.1,
      "objectiveParticipation": 0.78,
      "primaryPosition": "MID",
      "recentGamesAnalyzed": 20
    }
  }
}
```

**응답 예시 (404)**
```json
{
  "success": false,
  "error": "소환사를 찾을 수 없습니다."
}
```

---

## 3. Custom Game (내전 팀 밸런싱)

### `POST /api/custom-game/balance`

플레이어 목록을 입력받아 AI 기반 최적 팀 구성 Top 3를 반환합니다.

**요청 바디**

```json
{
  "players": [
    {
      "summonerName": "플레이어1",
      "primaryPosition": "TOP",
      "secondaryPosition": "FILL"
    },
    {
      "summonerName": "플레이어2",
      "primaryPosition": "JUNGLE",
      "secondaryPosition": "MID"
    }
    // ... 최대 10명
  ]
}
```

**포지션 값**

| 값 | 설명 |
|----|------|
| `TOP` | 탑 |
| `JUNGLE` | 정글 |
| `MID` | 미드 |
| `ADC` | 원거리 딜러 |
| `SUPPORT` | 서포터 |
| `FILL` | 상관없음 |

**응답 예시 (200)**
```json
{
  "success": true,
  "data": {
    "playerCount": 10,
    "results": [
      {
        "rank": 1,
        "teamA": [
          {
            "summonerName": "플레이어1",
            "assignedPosition": "TOP",
            "hiddenMmr": 6.75,
            "tier": "PLATINUM",
            "rank": "I"
          }
        ],
        "teamB": [
          {
            "summonerName": "플레이어2",
            "assignedPosition": "JUNGLE",
            "hiddenMmr": 6.5,
            "tier": "GOLD",
            "rank": "I"
          }
        ],
        "teamAWinRate": 0.52,
        "teamBWinRate": 0.48,
        "balanceScore": 0.8
      }
    ]
  }
}
```

**응답 예시 (400)**
```json
{
  "success": false,
  "error": "플레이어 수는 2명 이상 10명 이하여야 합니다."
}
```

---

## 에러 코드 정리

| HTTP 상태 | 원인 |
|-----------|------|
| `400` | 잘못된 요청 (파라미터 누락, 유효하지 않은 값) |
| `404` | 소환사를 찾을 수 없음 |
| `429` | 요청 한도 초과 (분당 100회) |
| `500` | 서버 내부 오류 |

---

## 프론트엔드 연동 가이드

### 환경 변수 설정 (Next.js)

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

### API 호출 예시 (TypeScript)

```typescript
// 소환사 프로필 조회
const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/summoner/${encodeURIComponent(name)}`);
const { data } = await res.json();

// 팀 밸런싱 요청
const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/custom-game/balance`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ players }),
});
const { data } = await res.json();
```

---

## 관련 문서

- [시스템 아키텍처](./architecture.md)
- [요구사항 명세](./requirements.md)
- Swagger UI: `http://localhost:4000/docs`
