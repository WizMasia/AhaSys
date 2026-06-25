import type React from 'react';
import { Globe, Upload } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { ReviewInputMode, UploadedImage } from './ReviewTab.types';

interface ReviewDraftWorkspaceProps {
  readonly inputMode: ReviewInputMode;
  readonly setInputMode: (mode: ReviewInputMode) => void;
  readonly inputText: string;
  readonly setInputText: (text: string) => void;
  readonly websiteUrl: string;
  readonly setWebsiteUrl: (url: string) => void;
  readonly additionalContext: string;
  readonly setAdditionalContext: (text: string) => void;
  readonly uploadedImages: readonly UploadedImage[];
  readonly dragActive: boolean;
  readonly handleDrag: React.DragEventHandler;
  readonly handleDrop: React.DragEventHandler;
  readonly handleImageChange: React.ChangeEventHandler<HTMLInputElement>;
  readonly clearAllImages: () => void;
  readonly removeUploadedImage: (index: number) => void;
}

export function ReviewDraftWorkspace({
  inputMode,
  setInputMode,
  inputText,
  setInputText,
  websiteUrl,
  setWebsiteUrl,
  additionalContext,
  setAdditionalContext,
  uploadedImages,
  dragActive,
  handleDrag,
  handleDrop,
  handleImageChange,
  clearAllImages,
  removeUploadedImage,
}: ReviewDraftWorkspaceProps) {
  const { darkMode } = useApp();

  return (
    <>
        {/* Immediate Ad Creator Workspace & Dropzone Box */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>

          <div className="space-y-4">
            {/* Realtime channel selector tabs */}
            <div className="flex gap-2 border-b border-slate-800/20 dark:border-slate-800 pb-2.5">
              <button
                id="opt_mode_text"
                type="button"
                onClick={() => setInputMode('text')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${inputMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <span>✏️ 광고 문구 직접 기입</span>
              </button>
              <button
                id="opt_mode_url"
                type="button"
                onClick={() => setInputMode('url')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${inputMode === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>🔗 웹사이트 주소 평가</span>
              </button>
            </div>

            {inputMode === 'text' ? (
              <div>
                <label className="block text-xs font-extrabold text-indigo-300 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                  <span>📝 검토할 마케팅 카피 문장 입력</span>
                  <span className="text-[10px] font-normal text-slate-505">(선택 - 이미지 또는 URL과 교차 필수)</span>
                </label>
                <textarea
                  id="ad_input_textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="여기에 검토받고 싶은 광고 문구 초안이나 원문을 기재하세요. (예: 식약처 단독, 원금 무손실 보장, 여드름 완치, 세월호 등 민감 키워드가 포함될 시 법률 RAG 가동)"
                  rows={4}
                  className={`w-full p-4 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors leading-relaxed ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'}`}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-extrabold text-indigo-300 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                  <span>🖥️ 수집 및 심사할 홍보 웹사이트 주소(URL) 입력</span>
                </label>
                <input
                  id="url_input_field"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com/promotion-campaign"
                  className={`w-full p-4 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'}`}
                />
                <p className="text-[11px] text-slate-500 mt-1">※ 아하시스턴트가 실시간으로 웹페이지 텍스트를 크롤링하여 대한민국 안전 특별법 조문과 자동 대조합니다.</p>
              </div>
            )}

            {/* Context Input Field */}
            <div>
              <label className="block text-xs font-extrabold text-indigo-300 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                <span>💡 비텍스트 배경 맥락 추가 (광고 매체, 시점, 특수 구도 등)</span>
                <span className="text-[10px] font-normal text-slate-505">(선택)</span>
              </label>
              <textarea
                id="ad_context_textarea"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="예시: 추석 연휴 직전 10대 수험생 부모들을 타겟으로 한 인스타그램 스폰서드 배너 형태, 카카오톡 톡채널 카드뉴스 발송분"
                rows={2}
                className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors leading-relaxed ${darkMode ? 'bg-slate-950 border-slate-850 text-slate-200 placeholder-slate-650' : 'bg-slate-50 border-slate-250 text-slate-800 placeholder-slate-400'}`}
              />
            </div>

            {/* Multimodal File Dropzone with Multi-Image uploading */}
            <div>
              <label className="block text-sm font-extrabold text-indigo-300 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <span>🖼️ 비주얼 비전 심사 (카드뉴스/상세페이지 다중 첨부 가능)</span>
                <span className="text-xs font-normal text-slate-505">(선택 - 여러 개 드롭 및 첨부 가능)</span>
              </label>

              <div className="space-y-3">
                {/* Drag & Drop Zone */}
                <label
                  htmlFor="add_file_input"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer block relative ${
                    dragActive
                      ? 'border-amber-400 bg-amber-500/10'
                      : darkMode ? 'border-slate-800 bg-slate-950/50 hover:bg-slate-900/50' : 'border-slate-250 bg-slate-100/50 hover:bg-slate-200/50'
                  }`}
                >
                  <input
                    type="file"
                    id="add_file_input"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                  <div className="space-y-2 block">
                    <Upload className="w-7 h-7 text-indigo-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-300">
                      이미지 파일을 드롭하거나 클릭하여 여러 개 일괄 업로드
                    </p>
                    <p className="text-[10px] text-slate-505">
                      다수의 카드뉴스 배너, 상세페이지 등의 시각적 위반, 승인 마크 도용 자동대조
                    </p>
                  </div>
                </label>

                {/* Display Uploaded Image list in beautiful horizontal grid */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-indigo-400 font-extrabold flex items-center gap-1">
                        <span>✅ 업로드 완료된 시안:</span>
                        <span className="bg-indigo-500/10 px-2 py-0.5 rounded-full text-[10px]">{uploadedImages.length}개</span>
                      </span>
                      <button
                        id="clear_all_images_btn"
                        type="button"
                        onClick={clearAllImages}
                        className="text-[10px] text-rose-450 hover:underline font-bold cursor-pointer"
                      >
                        전체 제거
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {uploadedImages.map((img, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl border flex items-center gap-3 relative overflow-hidden transition-all hover:border-indigo-500/40 ${
                            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                          }`}
                        >
                          <img
                            src={img.b64}
                            alt={`Upload draft ${idx + 1}`}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-800 shadow-sm shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-extrabold text-slate-305 truncate" title={img.file.name}>
                              {img.file.name}
                            </p>
                            <p className="text-[9px] text-slate-500 block leading-tight">
                              {(img.file.size / 1024).toFixed(1)} KB | Multimodal
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUploadedImage(idx)}
                            className="w-6 h-6 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs transition-all shrink-0 cursor-pointer"
                            title="이 파일 제거"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
