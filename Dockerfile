# ===========================
# Stage 1: 빌드 스테이지
# Node.js 이미지에서 TypeScript를 JavaScript로 컴파일
# ===========================
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 먼저 복사 (레이어 캐싱 최적화)
COPY package*.json ./
COPY tsconfig.json ./

# 모든 의존성 설치 (devDependencies 포함 - 빌드에 필요)
RUN npm ci

# 소스 코드 복사
COPY src/ ./src/

# TypeScript 컴파일
RUN npm run build

# ===========================
# Stage 2: 프로덕션 스테이지
# 빌드 결과물만 포함한 경량 이미지
# ===========================
FROM node:20-alpine AS production

# 보안: root가 아닌 별도 사용자로 실행
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 빌드 결과물 복사
COPY --from=builder /app/dist ./dist

# 소유권 변경
RUN chown -R appuser:appgroup /app
USER appuser

# 포트 노출
EXPOSE 4000

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

# 서버 시작
CMD ["node", "dist/index.js"]
