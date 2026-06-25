import { FileText } from 'lucide-react';
import Markdown from 'react-markdown';
import { useApp } from '../../contexts/AppContext';

interface MarkdownReportPanelProps {
  readonly getMarkdownReportString: () => string;
}

export function MarkdownReportPanel({ getMarkdownReportString }: MarkdownReportPanelProps) {
  const { darkMode, fontSize } = useApp();

  return (
    <>
            {/* AI 종합 준법 심의 평론서 (마크다운 실시간 뷰어 - 글꼴 스케일링 동시 대응) */}
            <div className={`p-6 rounded-3xl border space-y-4 printable-report ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-205 shadow-md'}`}>
              <div className="flex justify-between items-center border-b border-slate-850 pb-3 no-print">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h4 className={`font-black text-sm uppercase tracking-wider ${darkMode ? 'text-indigo-305' : 'text-indigo-950 font-black'}`}>✨ AI 정밀 자율 준법 심의 평론서 (Markdown Live Reader)</h4>
                </div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase font-bold tracking-wider shrink-0">Markdown Rendered</span>
              </div>

              <div className={`markdown-body ${darkMode ? 'text-slate-300' : 'text-slate-900 font-medium'} antialiased overflow-x-auto leading-relaxed text-size-${fontSize}`}>
                <Markdown>{getMarkdownReportString()}</Markdown>
              </div>
            </div>
    </>
  );
}
