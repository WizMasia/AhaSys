# 🛡️ 아하시스턴트 AI Compliance Review Platform Suite (aHaSys)

> **공정거래위원회(KFTC) 광고 합의·심사 기준 및 대한민국 5단계 특별 상호 법률 결합 실시간 자율 심의 플랫폼**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)

**아하시스턴트(aHaSys)**는 기업의 마케팅 광고 문구, 상품 설명서, 웹사이트 랜딩 페이지 등 다양한 미디어 자산이 대한민국 광고 표시규제법 및 공정거래위원회 가이드라인을 준수하는지 실시간 분석·진단하는 고성능 자율 준법 감시 플랫폼입니다.

---

## ✨ 핵심 기능 (Key Features)

1. **실시간 광고 규제 위반 자율 심사 (Online Auto-Audit)**
   * 텍스트 혹은 분석 타겟 웹사이트 URL을 입력하여 불법/허위·과장 광고 소지 여부 정밀 감수.
   * 이미지 업로드를 통한 시각 요소 위반 탐지 및 우회 문안 자동 도출.

2. **지능형 다중 LLM 결합 어댑터 (Multi-Engine Adapter System)**
   * **Gemini Engine**: Google AI Studio 기반 고성능 클라우드 추론엔진 (공유 키 대기 또는 사용자 개인 키 우회 연결 지향).
   * **Local Engine**: 완전히 격리된 오프라인 프라이버시 검수를 위한 **Ollama** 및 **LM Studio** 원클릭 하이퍼링크 대입 기능 지원.
   * **Other Engine**: **OpenAI API(GPT-4o)**, **OpenRouter** 등 글로벌 상용 LLM 프록시 다이렉트 매핑.

3. **하이브리드 RAG 지식 매핑 (Hybrid RAG Vector Scanner)**
   * 최신 공정위 법령 고시, 판례 가치 척도 데이터베이스 기반 검색 매핑 및 실시간 가중치 분석 연계.

4. **A4 공무 규정 표준 결과보고서 및 프린트 전용 엔진**
   * 실시간 A4 스케일의 공식 준법 보고서 자동 생성, 아이프레임 제한이 없는 완벽한 **PDF 인쇄 및 즉시 저장 인터페이스** 내장.

5. **개인 정보 유출 방지 및 세션 영구 보존**
   * 기재된 맞춤형 LLM 설정 및 분석 관련 메타 크레덴셜은 사용자의 브라우저 로컬 저장공간(localStorage)에 안전하게 귀속 보관 처리되어 유실되지 않습니다.

---

## 🛠️ 기술 스택 (Tech Stack)

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS (v4), Motion (Framer Motion), Lucide Icons
* **Backend**: Express (Custom Node Server), Node.js, `tsx` CLI runner
* **APIs & RAG Systems**: Gemini API SDK (`@google/genai`), Hybrid Lexical Correlation Mapper

---

## 🚀 로컬 설치 및 구동 방법 (Installation & Getting Started)

본 도구는 클라우드 샌드박스 독립 컨테이너 환경에서 구동되므로, 사용자의 개인 로컬 컴퓨터 컴퓨터 주소(`localhost` / `127.0.0.1`)의 Ollama/LM Studio 등에 다이렉트로 접근하려면 패키지를 다운로드한 후 본인 로컬 컴퓨터 환경에서 직접 수행하시는 것을 강력 권장합니다.

### 1) 사전 필수 요구 사항
* **Node.js**: v18.0.0 이상 설치 권장
* **npm** 또는 **yarn**
* (선택) **Ollama**가 로컬 컴퓨터에 구동 중인 경우 (`ollama run gemma2:9b` 등)

### 2) 소스코드 내려받기 및 종속성 설치
사용자 화면의 우측 상단 `[Export ZIP]` 메뉴를 눌러 소스 코드를 아카이브 파일 형태로 다운로드하고 압축을 해제합니다. 이후 터미널을 열고 다음 명령문을 수행합니다.

```bash
# 종속성 모듈 다운로드 및 빌드 환경 전개
npm install
```

### 3) 환경 변수 설정
프로젝트 루트 폴더에 `.env` 파일을 생성하고 필요한 API Key 자격 증명을 입력합니다. (예시는 `.env.example` 파일을 참조하십시오.)

```env
# .env 파일 예시
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

### 4) 개발용 전반 로컬 서버 기동
Express 백엔드 기동과 Vite 개발 모듈을 동시에 시작하기 위해 아래 스크립트를 작동시킵니다.

```bash
# 로컬 개발 진영 활성화
npm run dev
```

서버 브라우저 로딩 주소: `http://localhost:3000`

### 5) 상용 빌드 및 실무 배포 (Production Build)
실제 정적 번들 컴파일 및 Standindependent 구동용 공용 서버는 아래 빌드 지시를 통해 실행됩니다.

```bash
# 컴파일 및 esbuild 백엔드 단일 번들화
npm run build

# 프로덕션 상태에서 가동 개시
npm start
```

---

## 🛡️ 저작권 및 면책 조항 (Copyright & Support Info)

* **제작자 (Author)**: **WizMasia** ([wizmasia@gmail.com](mailto:wizmasia@gmail.com))
* **지적 권리 고지**:
  본 **아하시스턴트 AI Compliance review Platform Suite(aHaSys)** 제품을 구성하는 RAG 법률 조문 매핑 알고리즘 디자인, 연계 벌점 감수 매트릭스 공식 등의 응용 지적 고안은 개발자 WizMasia가 연구 설계 및 개발한 비영리/참고 지적 자산이며, 본 소프트웨어는 사용된 기반 오픈소스 및 API 솔루션사(Google, Tailwind CSS 등)의 라이선스 정책에 상호 종속됩니다.
* **법적 면책 사항**:
  동적 대조에 활용되는 판례 및 법규 데이터베이스 원형은 대한민국 국가법령정보센터(법제처) 공개 API에 법적 기준을 두며, Gemini 및 로컬 Google Gemma 모델 상표권·지적 권리는 Google LLC에 귀속됩니다. 본 시스템은 준법 심의 및 대안 문장 추천에 도움을 주는 참고용 어시스턴트 서비스로서, 실제 사법 기관이나 공정위 심사관의 실질적 유권 해석 및 사법적 소송 결과와 완벽히 100% 대응함을 완전히 보증하지는 않으므로 법적 분쟁 시 조언적 데이터로만 상호 대조하는 것을 권장합니다.
