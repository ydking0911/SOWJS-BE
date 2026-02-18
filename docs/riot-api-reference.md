# Riot API 레퍼런스 — SOWJS.KR

> **Base URLs**
> - KR 서버: `https://kr.api.riotgames.com`
> - Asia 라우팅: `https://asia.api.riotgames.com`
>
> **인증**: 모든 요청에 `X-Riot-Token: {API_KEY}` 헤더 필요
>
> **공식 문서**: https://developer.riotgames.com/apis

---

## Rate Limit

| 키 종류 | 제한 |
|---------|------|
| **Development Key** | 20 req/s, 100 req/2min |
| **Production Key** | 앱별 별도 협의 (심사 후 부여) |

> ⚠️ 429 응답 시 `Retry-After` 헤더 값만큼 대기 후 재시도

---

## 1. Summoner API

소환사 기본 정보를 조회합니다.

### `GET /lol/summoner/v4/summoners/by-name/{summonerName}`

소환사명으로 기본 정보 조회.

**Path Params**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `summonerName` | string | 소환사명 (URL 인코딩 필요) |

**응답 예시**
```json
{
  "id": "encrypted_summoner_id",
  "accountId": "encrypted_account_id",
  "puuid": "player_unique_uuid",
  "name": "페이커",
  "profileIconId": 4567,
  "revisionDate": 1708000000000,
  "summonerLevel": 500
}
```

### `GET /lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}`

PUUID로 소환사 정보 조회 (매치 데이터에서 PUUID 획득 후 사용).

---

## 2. League API

랭크 정보를 조회합니다.

### `GET /lol/league/v4/entries/by-summoner/{encryptedSummonerId}`

소환사 ID로 모든 큐의 랭크 정보 조회.

**Path Params**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `encryptedSummonerId` | string | Summoner API에서 획득한 `id` |

**응답 예시**
```json
[
  {
    "leagueId": "...",
    "summonerId": "...",
    "summonerName": "페이커",
    "queueType": "RANKED_SOLO_5x5",
    "tier": "CHALLENGER",
    "rank": "I",
    "leaguePoints": 1200,
    "wins": 350,
    "losses": 200,
    "hotStreak": true,
    "veteran": true,
    "freshBlood": false,
    "inactive": false
  }
]
```

**queueType 종류**

| 값 | 설명 |
|----|------|
| `RANKED_SOLO_5x5` | 솔로/듀오 랭크 |
| `RANKED_FLEX_SR` | 자유 랭크 |

---

## 3. Match API (v5)

> **Base URL**: `https://asia.api.riotgames.com` (KR 서버는 asia 라우팅 사용)

매치 기록을 조회합니다.

### `GET /lol/match/v5/matches/by-puuid/{puuid}/ids`

PUUID로 최근 매치 ID 목록 조회.

**Path Params**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `puuid` | string | 플레이어 고유 UUID |

**Query Params**

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `queue` | int | - | 큐 ID (420: 솔로랭크, 440: 자유랭크, 빈값: 전체) |
| `count` | int | 20 | 조회할 게임 수 (최대 100) |
| `start` | int | 0 | 시작 인덱스 (페이지네이션) |
| `startTime` | long | - | 시작 타임스탬프 (epoch seconds) |
| `endTime` | long | - | 종료 타임스탬프 (epoch seconds) |

**응답 예시**
```json
["KR_7123456789", "KR_7123456788", "KR_7123456787"]
```

**주요 Queue ID**

| ID | 설명 |
|----|------|
| `420` | 솔로/듀오 랭크 |
| `440` | 자유 랭크 |
| `450` | 칼바람 나락 |
| `400` | 일반 게임 |
| `0` | 커스텀 게임 (내전) |

### `GET /lol/match/v5/matches/{matchId}`

매치 ID로 상세 정보 조회.

**응답 주요 필드 (participants 배열 내)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `puuid` | string | 플레이어 UUID |
| `summonerName` | string | 소환사명 |
| `championName` | string | 챔피언명 |
| `teamPosition` | string | 포지션 (`TOP`, `JUNGLE`, `MIDDLE`, `BOTTOM`, `UTILITY`) |
| `kills` | int | 킬 수 |
| `deaths` | int | 데스 수 |
| `assists` | int | 어시스트 수 |
| `totalMinionsKilled` | int | 미니언 CS |
| `neutralMinionsKilled` | int | 중립 몬스터 CS (정글러) |
| `visionScore` | int | 시야 점수 |
| `win` | bool | 승리 여부 |
| `dragonKills` | int | 드래곤 킬 수 |
| `baronKills` | int | 바론 킬 수 |
| `goldEarned` | int | 획득 골드 |
| `totalDamageDealtToChampions` | int | 챔피언에게 가한 피해량 |
| `wardsPlaced` | int | 와드 설치 수 |
| `wardsKilled` | int | 와드 제거 수 |

**응답 주요 필드 (info 최상위)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `gameDuration` | int | 게임 시간 (초) |
| `gameVersion` | string | 패치 버전 (예: `14.3.1`) |
| `queueId` | int | 큐 ID |

---

## 4. Champion Mastery API

챔피언 숙련도를 조회합니다.

### `GET /lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}/top`

PUUID로 상위 숙련도 챔피언 목록 조회.

**Query Params**

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `count` | int | 3 | 조회할 챔피언 수 (최대 10) |

**응답 예시**
```json
[
  {
    "puuid": "...",
    "championId": 157,
    "championLevel": 7,
    "championPoints": 450000,
    "lastPlayTime": 1708000000000,
    "championPointsSinceLastLevel": 21600,
    "tokensEarned": 0
  }
]
```

---

## 5. Data Dragon (정적 데이터)

> **Base URL**: `https://ddragon.leagueoflegends.com`
> 인증 불필요 (공개 CDN)

챔피언 이미지, 아이템 정보 등 정적 게임 데이터를 제공합니다.

### 최신 패치 버전 조회
```
GET https://ddragon.leagueoflegends.com/api/versions.json
```

### 챔피언 전체 목록
```
GET https://ddragon.leagueoflegends.com/cdn/{version}/data/ko_KR/champion.json
```

### 챔피언 상세 정보
```
GET https://ddragon.leagueoflegends.com/cdn/{version}/data/ko_KR/champion/{championName}.json
```

### 챔피언 이미지
```
https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{championName}.png
```

### 아이템 전체 목록
```
GET https://ddragon.leagueoflegends.com/cdn/{version}/data/ko_KR/item.json
```

### 프로필 아이콘 이미지
```
https://ddragon.leagueoflegends.com/cdn/{version}/img/profileicon/{profileIconId}.png
```

---

## SOWJS.KR 사용 API 요약

| API | 엔드포인트 | 용도 |
|-----|-----------|------|
| Summoner v4 | `by-name/{name}` | 소환사 기본 정보 조회 |
| League v4 | `entries/by-summoner/{id}` | 솔로랭크 티어/LP 조회 |
| Match v5 | `by-puuid/{puuid}/ids` | 최근 매치 ID 목록 |
| Match v5 | `matches/{matchId}` | 매치 상세 (KDA, CS, 시야 등) |
| Champion Mastery v4 | `by-puuid/{puuid}/top` | 모스트 챔피언 조회 |
| Data Dragon | `champion.json`, `item.json` | 챔피언/아이템 정적 데이터 |

---

## 에러 코드

| HTTP | 의미 | 대응 |
|------|------|------|
| `400` | 잘못된 요청 | 파라미터 확인 |
| `401` | API 키 없음 | 헤더 확인 |
| `403` | API 키 만료/차단 | 키 재발급 |
| `404` | 데이터 없음 | 소환사명 확인 |
| `429` | Rate Limit 초과 | `Retry-After` 헤더 참조 후 재시도 |
| `500` | Riot 서버 오류 | 잠시 후 재시도 |
| `503` | Riot 서버 점검 | 점검 완료 후 재시도 |
