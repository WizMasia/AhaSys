# aHaSys 프론트엔드 리팩터링 설계 명세서 (Phase A)

본 명세서는 `src/App.tsx` 파일(약 2,600줄)의 복잡성을 낮추고 단일 책임 원칙(SRP)을 달성하기 위해, 커스텀 훅 및 컴포넌트 구조로 격리 설계한 명세입니다.

---

## 1. 커스텀 훅 설계: `useLLMConfig`

현재 `App.tsx` 내에서 LLM 상태, 드래프트 상태, 로컬스토리지 연동, 그리고 프리셋 변경 로직이 얽혀 있습니다. 이를 완전히 격리합니다.

### 📂 위치: `src/hooks/useLLMConfig.ts`

### 💡 주요 상태 및 역할
* **Active State**: 현재 실제 분석에 사용되는 LLM 설정 상태 (`adapterType`, `customModel`, `customEndpoint`, `customApiKey`)
* **Draft State**: UI(SettingsTab) 내에서 입력 중이나 아직 '적용'을 누르기 전인 상태 (`draftAdapterType`, `draftCustomModel`, `draftCustomEndpoint`, `draftCustomApiKey`)
* **Presets**: 로컬/원격 프리셋 선택 상태 (`localPreset`, `otherPreset`)
* **API 호출**: 특정 엔드포인트에서 지원 모델 리스트 가져오기 (`fetchCustomModels`)

### 🛠️ 반환값 (Interface)
```typescript
interface UseLLMConfigReturn {
  // Active State
  adapterType: LLMType;
  customModel: string;
  customEndpoint: string;
  customApiKey: string;
  
  // Draft State & Setters
  draftAdapterType: LLMType;
  setDraftAdapterType: (t: LLMType) => void;
  draftCustomModel: string;
  setDraftCustomModel: (m: string) => void;
  draftCustomEndpoint: string;
  setDraftCustomEndpoint: (ep: string) => void;
  draftCustomApiKey: string;
  setDraftCustomApiKey: (key: string) => void;
  
  // Presets
  localPreset: string;
  otherPreset: string;
  
  // States for Fetching Models
  fetchedModels: string[];
  fetchModelsLoading: boolean;
  fetchModelsError: string;
  
  // Status Indicator
  settingsSavedSuccess: boolean;
  
  // Handlers
  applyLocalPreset: (preset: 'ollama' | 'lmstudio') => void;
  applyOtherPreset: (preset: 'openai' | 'openrouter' | 'custom') => void;
  fetchCustomModels: () => Promise<void>;
  handleSaveSettings: () => void;
}
```

---

## 2. 컴포넌트 추출 설계: 서브 탭 컴포넌트

`App.tsx`에서 각 탭의 뷰 및 상태 핸들러를 분리하여 Props 구조로 격리합니다.

### 📂 위치: `src/components/*`

### ① `SettingsTab.tsx`
* **역할**: LLM 어댑터 설정을 구성하는 UI.
* **주요 Props**:
  * `useLLMConfig` 훅에서 반환되는 드래프트 상태 및 핸들러들
  * `darkMode`: UI 스타일용 다크모드 여부

### ② `ReviewTab.tsx`
* **역할**: 준법 분석 입력창, 드래그 앤 드롭 이미지 업로드, 분석 실행 로더, 결과 리포트 출력 및 A4 인쇄창 제어.
* **주요 Props**:
  * `darkMode`, `fontSize`
  * `inputText`, `setInputText`, `websiteUrl`, `setWebsiteUrl`, `additionalContext`, `setAdditionalContext`
  * `uploadedImages`, `setUploadedImages`
  * LLM 관련 액티브 설정 (`adapterType`, `customModel` 등)
  * 분석 결과 상태 및 분석 실행 함수 (`analysisResult`, `runAnalysis`, `analysisLoading` 등)

### ③ `BenchmarkTab.tsx`
* **역할**: 벤치마크 케이스들의 로딩, 실행 상태 표시, 성공/실패 여부와 레이턴시 통계 시각화.
* **주요 Props**:
  * `darkMode`
  * `benchmarkCases`, `setBenchmarkCases`, `benchmarkRunning`, `runBenchmark`, `benchmarkStats`

### ④ `HistoryTab.tsx`
* **역할**: 세션 보존 내역 리스트업, 상세 결과 팝업 복구, 삭제 제어.
* **주요 Props**:
  * `darkMode`
  * `historyItems`, `fetchHistory`, `deleteHistoryItem`, `restoreHistoryItem`

### ⑤ `AboutTab.tsx`
* **역할**: 아하시스턴트 법률 준수 규정 요약 및 아키텍처 설명서 렌더링.
* **주요 Props**:
  * `darkMode`

---

## 3. 리팩터링 실행 전략 및 검증 원칙
1. **타입 안전성**: `@/src/types.ts`에 선언된 공유 모델 유형을 준수하며, `any`나 `ts-ignore` 등을 금지합니다.
2. **스타일 일관성**: Tailwind CSS 클래스 조합과 Lucide React 아이콘들을 손상시키지 않고 그대로 유지합니다.
3. **단위 검증**: 컴포넌트를 하나씩 분리할 때마다 Vite 개발 서버 및 빌드 컴파일을 시도하여 LSP Diagnostics를 점검합니다.
