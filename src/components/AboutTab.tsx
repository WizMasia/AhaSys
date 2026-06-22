/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  Cpu 
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function AboutTab() {
  const { darkMode } = useApp();
  return (
    <div className="space-y-6">
      {/* Category-Neutral General Introduction Board */}
      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl flex items-center gap-2 text-slate-100">
              <span>아하시스턴트 (aHaSys) 플랫폼 지침</span>
              <span className="text-xs bg-slate-500/20 px-2 py-0.5 rounded font-normal text-slate-400 font-sans">종합 무결성 자율 규율 가이드라인</span>
            </h2>
            <p className="text-[10px] text-slate-450 uppercase tracking-wider font-semibold font-mono">Autonomous Cross-Domain Compliance Platform & Guides</p>
          </div>
        </div>
        
        <div className="text-sm text-slate-300 leading-relaxed space-y-4">
          <p>
            안녕하세요! <strong>아하시스턴트 (aHaSys)</strong>는 각종 마케팅 카피나 카드뉴스 이미지 초안을 종합 진단하여 공정위 과장 기만 금지 조항, 개별 건강·보건·금융 특별법, 그리고 역사적 참사/사회적 비극 상업 오용 금지 기준 위배 여부를 RAG 기반으로 사전 적법 검수하는 최첨단 솔루션입니다.
          </p>
          <p>
            검수 시 텍스트 문장만, 혹은 상세페이지/카드뉴스 이미지 파일만 단독 업로드하셔도 실시간 멀티모달 Vision AI 프로세서가 법규 무해성과 시각 자료 수치 대조 무결성을 병렬 심의합니다.
          </p>
        </div>
      </div>

      {/* Platform Info Hub Guides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-3 text-amber-500 font-extrabold text-sm">
            <span>⚖️ 5대 에이전트 병렬 최적화 라우팅</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            중앙 조정 에이전트(Orchestrator)가 1차 스캔하여 필요한 분야만 활성화합니다. 실정법률(LEGAL)은 상시 전문 검수하며, 비법률 영역(SOCIAL, ESG, PRIVACY, YOUTH)은 관련 핵심 구절만 분할 전송(Segment Routing)하여 정확성과 토큰 효율성을 극대화합니다.
          </p>
        </div>

        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-3 text-amber-500 font-extrabold text-sm">
            <span>🔍 국가법제처 교차 대조 검증</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            자체 LLM 생성의 신뢰도를 확보하기 위해, 인용된 위반 구절 법원 판례 및 법률 조문 데이터베이스를 실시간 교차 대조하여 일치율을 국가법제처 전면 검인 인증 마킹(Verified)을 통해 증명합니다.
          </p>
        </div>

        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-3 text-amber-500 font-extrabold text-sm">
            <span>📝 5단계 SOP 위기 대처 계획</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            규격 결함이나 마이너스 벌점 적발 시, 벌점이 추가 가중되거나 법적 가처분 소송 고위험군에 놓이지 않도록 즉시 조치해야 할 행동 지침(SOP)을 원칙 중단부터 권장 대안안 롤백, 후속 마케팅 복구까지 완벽하게 제시합니다.
          </p>
        </div>
      </div>

      {/* 🔒 SECURITY DISCLAIMER & LOCAL LLM RUNNING METHOD */}
      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-[#0e1626] border-slate-800' : 'bg-white border-slate-200 shadow-md'} space-y-6`}>
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/20">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 select-none" />
          <h3 className={`font-black text-base ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>🔒 기업 내부 검토를 위한 보안 유의사항 및 프라이버시 원칙</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-3">
            <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/35 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
              퍼블릭 클라우드 데이터 전송 위험 안내
            </span>
            <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
              본 배포용 데모 사이트는 공용 샌드박스에서 실행됩니다. 분석을 위해 기재하신 광고 카피나 업로드하신 멀티모달 파일은 외부 API 네트워크 서버망을 거쳐 연산 처리되므로, <strong>기업의 외외부 미출시 핵심 기밀 스펙, 내부 시안, 기밀 임상치 등 극도의 보안성이 확보되어야 하는 내부 검토 자료</strong>를 직접 기입하시는 것을 자제하여 주십시오.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl space-y-1.5">
              <p className="font-extrabold text-amber-400 text-[11px] flex items-center gap-1">
                ⚠️ 기업 내부 검토 권장사항
              </p>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                기업 고유 대외비를 심사하실 때에는 실제 제품 고유 스펙 명을 'A 성분', 'B 물질' 등의 익명 명칭으로 변경하여 기입하시거나, 기밀 유출이 절대 방지되는 **완전 오프라인 패쇄망 로컬 LLM 구동 환경**을 구성하여 주십시오.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
              웹브라우저 단독 처리가 아닌 풀스택(Full-Stack) 서비스 구조
            </span>
            <p className={`${darkMode ? 'text-slate-305' : 'text-slate-700 font-medium'}`}>
              본 서비스는 단순히 프론트엔드 자바스크립트 브라우저 단독으로 API를 호출하지 않고, **Node.js (Express.js) 백엔드 서버 컨트롤러를 내재한 정밀 풀스택 아키텍처**로 안전하게 통제되고 있습니다. 이는 Gemini API Private Key 노출을 전명 방지하고, 정방향 RAG 데이터 적합 가중치를 서버사이드에서 제어하기 위한 필수 설계입니다.
            </p>
            <p className="text-slate-400 text-[11.5px] leading-relaxed">
              따라서 회사의 인트라넷 보안 폐쇄 컴퓨터에서 구동하시기 위해서는 Node.js 런타임을 장착한 기업 자체 로컬 서버에 소스코드를 설치하시어 **로컬 LLM 서비스(Ollama, LM Studio 등)** 및 고안전 경량 모델인 **Gemma 2 / Gemma 3 / Gemma 4** 모델 계열과 결합하여 운용하실 것을 적극 제안드립니다.
            </p>
          </div>
        </div>

        {/* Step-by-Step Installation Process guidelines */}
        <div className="p-4 rounded-2xl bg-[#090e1a]/80 border border-indigo-500/15 text-left space-y-3 font-mono text-xs">
          <span className="text-[10px] bg-[#121b2d] text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded font-black">
            💻 오프라인 폐쇄망 로컬 인프라 구성 4단계 가이드 (Ollama & Gemma 연계)
          </span>
          <div className="space-y-2 text-slate-400 leading-relaxed text-[10.5px]">
            <p>
              <strong className="text-slate-200">1. Ollama 및 최신 Gemma 로컬 모델 구동</strong>
              <br />
              로컬 전용 딥러닝 서버에 Ollama를 설치한 후, 오프라인 검증용 고성능 국소 모델을 터미널에서 다운로드 및 구동합니다:
              <br />
              <span className="text-emerald-400 block bg-slate-950 p-1.5 rounded border border-slate-900 mt-1 select-all">
                $ ollama run gemma2:9b
              </span>
            </p>
            <p className="mt-2">
              <strong className="text-slate-200">2. 환경 설정 파일 배포 (.env.example 참고)</strong>
              <br />
              프로젝트 내에 <code className="text-indigo-400">.env</code> 파일을 형성하고 아래와 같이 로컬 LLM 프라미스 주소를 주입해주십시오:
              <br />
              <span className="text-slate-100 block bg-slate-950 p-1.5 rounded border border-slate-900 mt-1">
                LOCAL_LLM_ENDPOINT=http://localhost:11434/v1 <br />
                LOCAL_LLM_MODEL=gemma2:9b
              </span>
            </p>
            <p className="mt-2">
              <strong className="text-slate-200">3. Node.js 백엔드 로컬 패키지 인스톨</strong>
              <br />
              터미널에서 의존 부속 라이브러리를 통합 설치하고 로컬 일괄 빌드를 가감합니다:
              <br />
              <span className="text-emerald-400 block bg-slate-950 p-1.5 rounded border border-slate-900 mt-1 select-all">
                $ npm install && npm run build
              </span>
            </p>
            <p className="mt-2">
              <strong className="text-slate-200">4. 로컬 사내 서버 인트라넷 서비스 가동</strong>
              <br />
              배포용 서버를 컴파일 가동하여 전사 마케팅 부서가 동시 이용할 사내 인트라넷 주소를 부여합니다:
              <br />
              <span className="text-emerald-400 block bg-slate-950 p-1.5 rounded border border-slate-900 mt-1 select-all">
                $ npm run start&nbsp;&nbsp;# 사내 내부망 http://localhost:3000 으로 보안 접속
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 📜 SYSTEM SOLUTION ARCHITECTURE & COPYRIGHT DISCLOSURES */}
      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-[#0f1524]/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/10">
          <Cpu className="w-5 h-5 text-amber-500 shrink-0 select-none" />
          <h3 className={`font-black text-base ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>🛠️ 사용된 솔루션 기술 스택 및 저작권·라이선스 명시</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-800 bg-[#0b0f19]/40 space-y-1">
            <span className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider">Foundation Model Core</span>
            <p className="font-extrabold text-slate-200">Google Gemini API</p>
            <p className="text-[10px] text-slate-400">Gemini 1.5 Flash / 3.5 Flash 메가스케일 연동 어댑터 기술 탑재 (Google DeepMind 제공)</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-[#0b0f19]/40 space-y-1">
            <span className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider">Application Stack</span>
            <p className="font-extrabold text-slate-200">Express.js & React 18</p>
            <p className="text-[10px] text-slate-400">Node.js 서버 샌드박스 보안 스크롤 및 Vite 고성능 프론트엔드 빌드 엔진 연동</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-[#0b0f19]/40 space-y-1">
            <span className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider">Visual Interface & Styling</span>
            <p className="font-extrabold text-slate-200">Tailwind CSS & Lucide Icons</p>
            <p className="text-[10px] text-slate-400">일관성 있는 원색조 반응형 레이아웃 구성 및 Lucide 래이어 팩토리 그래픽스 사용</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-[#0b0f19]/40 space-y-1">
            <span className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider">Animation Framework</span>
            <p className="font-extrabold text-slate-200">Motion React</p>
            <p className="text-[10px] text-slate-400">부드럽고 직관적인 모듈 트랜지션 및 로더 스피너 마운트 위젯 연동</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0d1321] text-[11px] text-slate-400 leading-relaxed text-justify space-y-2">
          <p>
            ⚖️ <strong>저작권 안내 및 법적 면책 사항 (Copyright & Legal Disclaimers):</strong>
          </p>
          <p>
            본 '아하시스턴트 AI Compliance review Platform Suite(aHaSys)' 제품을 구성하는 RAG 법률 조문 매핑 알고리즘 디자인, 연계 벌점 감수 매트릭스 공식 등의 응용 지적 고안은 개발자가 연구 설계 및 개발된 비영리/참고 지적 자산이며, 본 소프트웨어는 사용된 기반 오픈소스 및 API 솔루션사(Google, Tailwind CSS 등)의 라이선스 정책에 상호 종속됩니다.
          </p>
          <p>
            동적 대조에 활용되는 판례 및 법규 데이터베이스 원형은 대한민국 국가법령정보센터(법제처) 공개 API에 법적 기준을 두며, Gemini 및 로컬 Google Gemma 모델 상표권·지적 권리는 Google LLC에 귀속됩니다. 본 시스템은 준법 심의 및 대안 문장 추천에 도움을 주는 참고용 어시스턴트 서비스로서, 실제 사법 기관이나 공정위 심사관의 실질적 유권 해석 및 사법적 소송 결과와 완벽히 100% 대응함을 완전히 보증하지는 않으므로 법적 분쟁 시 조언적 데이터로만 상호 대조하는 것을 권장합니다.
          </p>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>LICENSE: Apache License 2.0 (SPDX-License-Identifier: Apache-2.0)</span>
            <span>Copyright 2026. WizMasia. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
