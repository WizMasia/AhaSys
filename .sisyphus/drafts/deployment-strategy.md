# 🛡️ 아하시스턴트(aHaSys) 배포 전략 초안 (Draft)

## 1. 개요 및 분석 요약
* **어플리케이션 타입**: React + Express 단일 포트 통합 구동 풀스택 웹 서버.
* **프로덕션 런타임**: `NODE_ENV=production` 환경에서 `npm run build`로 생성된 `dist/` 폴더를 Express 내장 정적 미들웨어로 자체 서빙.
* **데이터베이스 의존성**: 없음 (인메모리 RAG 가이드라인 라이브러리 및 브라우저 `localStorage` 기반 상태 보존).
* **주요 시크릿**: `GEMINI_API_KEY` (Gemini API 호출 및 AI 실시간 진단용).

## 2. 배포 시나리오 비교
### 시나리오 A: PaaS 기반 단일 호스트 배포 (추천)
* **대상 서비스**: Render.com, Fly.io, Railway
* **장점**: 
  - 무료/낮은 비용 티어 보유.
  - 별도 Docker 컨테이너 생성 없이 Node.js 런타임 위에서 즉시 빌드 및 가동 가능.
  - `dist/` 정적 파일 빌드와 Express 구동이 단일 인프라에서 자동 수행.
* **배포 흐름**:
  1. `npm run build` 실행
  2. `NODE_ENV=production` 환경변수와 함께 `npm run start` (`tsx server.ts`) 실행.

### 시나리오 B: 클라우드 서버리스 컨테이너 배포 (GCP Cloud Run / AWS App Runner)
* **대상 서비스**: Google Cloud Run, AWS App Runner
* **장점**:
  - 트래픽이 없을 때 0으로 스케일 다운되어 리소스 낭비 없음 (초기 인프라 운영 비용 거의 없음).
  - Secret Manager 연동이 완벽하게 지원되어 `GEMINI_API_KEY` 보안이 탁월함.
* **단점**:
  - Dockerfile 작성이 선행되어야 함.

## 3. 핵심 배포 파이프라인
1. 의존성 설치 (`npm ci` 또는 `npm install`)
2. 프론트엔드 프로덕션 빌드 (`npm run build`)
3. 백엔드 가동 (`NODE_ENV=production tsx server.ts`)
4. 환경 변수 주입 (`PORT`, `GEMINI_API_KEY`, `APP_URL`, `NODE_ENV`)
