import { Github } from 'lucide-react';
import { LLMType } from '../../types';

interface AppFooterProps {
  readonly adapterType: LLMType;
  readonly customModel: string;
}

export function AppFooter({ adapterType, customModel }: AppFooterProps) {
  return (
    <footer className="py-12 border-t border-slate-800/40 text-center text-xs text-slate-500 space-y-2.5 no-print">
      <p className="text-[10.5px] text-slate-400 font-bold max-w-3xl mx-auto leading-relaxed">
        ⚠️ [면책 고지] 본 플랫폼은 일반인인 개인 개발자(WizMasia)가 독자적으로 구축한 비공식 연구용 개인 프로젝트입니다. 공정거래위원회 등 특정 정부 기관 및 사법 기관을 대변하지 않으며, 어떠한 공식 유관 관계도 없습니다. 심사 결과 및 대안 조언은 법적 구속력이 없는 단순 자율 참고용 사항이므로 실제 법적 분쟁이나 처분 결정의 증빙용으로 사용될 수 없습니다.
      </p>
      <p>본 플랫폼의 저작권은 가용 오픈소스 및 구성 API 솔루션사(Google Gemini, Tailwind CSS 등)의 라이선스 정책에 상호 복속됩니다.</p>
      <p className="text-[10.5px]">
        제작자: WizMasia | 문의 이메일: <a href="mailto:wizmasia@gmail.com" className="underline hover:text-indigo-400">wizmasia@gmail.com</a> | &copy; 2026. WizMasia. All rights reserved.
      </p>
      <div className="flex justify-center items-center gap-1.5 text-[11px] text-slate-400 font-bold">
        <Github className="w-4 h-4 text-slate-400" />
        <span>공식 소스코드 저장소:</span>
        <a
          href="https://github.com/WizMasia/aHaSys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline font-black"
        >
          GitHub (WizMasia/aHaSys)
        </a>
      </div>
      <p className="text-[10px] text-slate-600">Powered by {adapterType === LLMType.GEMINI ? 'Gemini API' : 'OpenAI-Compatible'} ({customModel}) Core Adaptor with Autonomous Hybrid RAG Scanners.</p>
    </footer>
  );
}
