# 🛡️ aHaSys Ponytail Simplification Plan

이 계획서는 불필요한 추상화 레이어를 걷어내고 가장 간결하며 단순한 코드로 작동되도록 정비하기 위한 간소화 계획입니다.

## 1. 제거 및 단순화 대상 (Abstractions to Remove)

### ① LLM 어댑터 클래스 다형성 단순화 (`server/services/llmService.ts`)
* **현황**: `LLMAdapter` 인터페이스와 `GeminiAdapter`, `OpenAICompatibleAdapter` 클래스로 복잡하게 분리되어 있음.
* **해결 (YAGNI)**: 다형성 클래스 레이어를 걷어내고, 단순한 단일 헬퍼 함수 `async function fetchLLMAnalysis(payload)` 형태로 단축. 클래스 보일러플레이트 제거.

### ② JSON 복구 로직 라인 축소 (`server/services/llmService.ts`)
* **현황**: 여러 줄의 `try-catch` 중첩 및 정규식 치환 처리.
* **해결**: 단 한 줄 또는 두 줄의 단순 파싱 필터 함수로 결합.

### ③ React Context 상태 통합 (`src/contexts/AppContext.tsx`)
* **현황**: SettingsTab에서 임시 저장용으로 사용하는 8개 이상의 `draft*` 상태 변수들이 중복 존재하여 AppContext의 부하를 키우고 있음.
* **해결**: 복잡한 드래프트 상태들을 독립 훅에서 local state로 관리하도록 제거하고, AppContext는 최상위 활성 상태만 남김.

---
* skipped: Custom adapter classes, draft context state variables.
* add when: Code reduction is applied to services and contexts.
