# SOWJS.KR LoL Custom Game Team Balancer

![SOWJS.KR Banner](https://img.shields.io/badge/Service-SOWJS.KR-blueviolet?style=for-the-badge&logo=leagueoflegends)
![Status](https://img.shields.io/badge/Status-Beta-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**SOWJS.KR**(소우주)은 실질적인 게임 기여도 데이터와 AI 엔진을 활용하여 리그 오브 레전드 내전(커스텀 게임)의 팀 밸런스를 환상적으로 맞춰주는 서비스입니다. 단순한 티어 합산에서 벗어나 플레이어의 진짜 실력("Hidden MMR")을 반영한 최적의 팀 매칭을 경험해보세요.

---

## 🚀 주요 기능

- **AI 기반 팀 밸런싱**: 소환사 10명의 최근 20~50 게임 데이터를 분석하여 승률 50:50에 가장 가까운 팀 구성을 제안합니다.
- **Hidden MMR 산출**: KDA, 분당 CS, 시야 점수, 오브젝트 기여도 등을 종합하여 단순 티어보다 정확한 실력 지표를 제공합니다.
- **내전 최적화**: 포지션 선호도를 고려한 팀 배정과 밸런스 점수를 통해 공정한 경기 환경을 조성합니다.
- **초경량 전적 검색**: 내전에 필요한 핵심 지표만 빠르게 확인할 수 있는 소환사 프로필 기능을 제공합니다.

---

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, shadcn/ui
- **Deployment**: Vercel

### Backend (BFF)
- **Runtime**: Node.js v20 (Fastify)
- **Language**: TypeScript
- **Infrastructure**: AWS EC2, Docker

### AI/ML Engine
- **Framework**: Python (FastAPI)
- **Analysis**: scikit-learn, numpy, pandas
- **Infrastructure**: AWS EC2

### Database & Cache
- **Database**: PostgreSQL (AWS RDS)
- **Caching**: Redis (AWS ElastiCache)

---

## 📂 프로젝트 문서서

| 문서명 | 설명 |
|-------|------|
| [아이디어 개요](./docs/idea-overview.md) | 프로젝트 배경, 문제 정의, 해결 방안 ("Hidden MMR") |
| [SWOT 분석](./docs/swot-analysis.md) | 강점·약점·기회·위협 분석 및 전략 도출 |
| [요구사항 명세](./docs/requirements.md) | MVP 기능, 기술 스택, 비기능 요구사항 |
| [시스템 아키텍처](./docs/architecture.md) | AWS 인프라, 인스턴스 구성, 서비스 통신 흐름 |
| [API 명세서](./docs/api-spec.md) | 백엔드 REST API 명세 (프론트엔드 연동 가이드 포함) |
| [Riot API 레퍼런스](./docs/riot-api-reference.md) | 사용 중인 Riot API 엔드포인트 정리 |
| [Riot 제품 등록 신청서](./docs/riot-product-registration.md) | Production API Key 신청용 영문 작성본 |
| [코딩 규칙](./docs/coding-rules.md) | AI 보조 코딩 시 따라야 할 프롬프트 규칙 |

---

## 🏗 시작하기 (로컬 개발)

### 1. 환경 변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 Riot API 키를 입력합니다.
```bash
cp .env.example .env
```

### 2. 인프라 실행 (Docker)
Redis와 PostgreSQL을 실행합니다. (로컬 테스트용)
```bash
docker-compose up -d
```

### 3. 백엔드 서버 실행
```bash
npm install
npm run dev
```
서버가 시작되면 `http://localhost:4000/docs`에서 Swagger 문서를 확인할 수 있습니다.

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

© 2026 SOWJS.KR (소우주) - League of Legends Team Balancer