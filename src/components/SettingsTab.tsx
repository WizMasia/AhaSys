/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Settings, 
  HelpCircle, 
  Save, 
  Check 
} from 'lucide-react';
import { LLMType } from '../types';
import { useApp } from '../contexts/AppContext';

export function SettingsTab() {
  const {
    darkMode,
    adapterType,
    customModel,
    customEndpoint,
    customApiKey,
    localPreset: initialLocalPreset,
    otherPreset: initialOtherPreset,
    fetchedModels,
    fetchModelsLoading,
    fetchModelsError,
    settingsSavedSuccess,
    handleFetchModels,
    handleSaveSettings
  } = useApp();

  // Local draft states to prevent global React Context re-renders on every keystroke
  const [draftAdapterType, setDraftAdapterType] = useState<LLMType>(adapterType);
  const [draftCustomModel, setDraftCustomModel] = useState<string>(customModel);
  const [draftCustomEndpoint, setDraftCustomEndpoint] = useState<string>(customEndpoint);
  const [draftCustomApiKey, setDraftCustomApiKey] = useState<string>(customApiKey);
  const [localPreset, setLocalPreset] = useState<string>(initialLocalPreset);
  const [otherPreset, setOtherPreset] = useState<string>(initialOtherPreset);

  // Sync draft states when active settings change
  useEffect(() => {
    setDraftAdapterType(adapterType);
    setDraftCustomModel(customModel);
    setDraftCustomEndpoint(customEndpoint);
    setDraftCustomApiKey(customApiKey);
    setLocalPreset(initialLocalPreset);
    setOtherPreset(initialOtherPreset);
  }, [adapterType, customModel, customEndpoint, customApiKey, initialLocalPreset, initialOtherPreset]);

  const applyLocalPreset = (preset: 'ollama' | 'lmstudio') => {
    setLocalPreset(preset);
    if (preset === 'ollama') {
      setDraftCustomEndpoint('http://localhost:11434/v1');
      setDraftCustomModel('gemma2:9b');
    } else {
      setDraftCustomEndpoint('http://localhost:1234/v1');
      setDraftCustomModel('gemma-2-9b-it');
    }
  };

  const applyOtherPreset = (preset: 'openai' | 'openrouter' | 'custom') => {
    setOtherPreset(preset);
    if (preset === 'openai') {
      setDraftCustomEndpoint('https://api.openai.com/v1');
      setDraftCustomModel('gpt-4o-mini');
    } else if (preset === 'openrouter') {
      setDraftCustomEndpoint('https://openrouter.ai/api/v1');
      setDraftCustomModel('openrouter/free');
    } else {
      setDraftCustomEndpoint('');
      setDraftCustomModel('');
    }
  };

  const onSave = () => {
    handleSaveSettings({
      adapterType: draftAdapterType,
      customModel: draftCustomModel,
      customEndpoint: draftCustomEndpoint,
      customApiKey: draftCustomApiKey,
      localPreset,
      otherPreset
    });
  };

  const onFetchModels = async () => {
    const list = await handleFetchModels(draftCustomEndpoint, draftCustomApiKey);
    if (list && list.length > 0) {
      setDraftCustomModel(list[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* General Introduction Card */}
      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-405 font-bold shadow-lg shadow-indigo-500/5">
            <Settings className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className={`font-black text-lg flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-950'}`}>
              <span>준법 RAG 엔진 물리 어댑터 설정</span>
              <span className="text-xs bg-slate-500/20 px-2 py-0.5 rounded font-normal text-slate-405 font-sans">LLM Configuration</span>
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Select Infrastructure Adapter & Set API Key Credentials</p>
          </div>
        </div>
        
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'} leading-relaxed`}>
          대한민국의 복합적 광고 법규 및 RAG 가중 전파 수칙을 통섭하는 물리 어댑터 어레인지 환경설정입니다. 
          인프라 공유 기본 Gemini 모델을 활용할 수 있으나, 할당량 초과(429 Quota Exceeded) 예방이나 쾌적한 처리 향상을 위해 수동 API Key 우회 설정을 권장해 드립니다.
        </p>
      </div>

      {/* Model Switcher and Credentials Setup */}
      <div className={`p-6 rounded-3xl border space-y-5 ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-205 shadow-md'}`}>
        <div className="flex items-center gap-1.5 mb-1 text-slate-300">
          <Sliders className="w-4 h-4 text-amber-500" />
          <h4 className={`font-black text-sm uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-950 font-black'}`}>1. 기저 추론 엔진 선정</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            id="settings_adapter_tab_gemini"
            onClick={() => {
              setDraftAdapterType(LLMType.GEMINI);
              setDraftCustomModel('gemini-3.5-flash');
            }}
            className={`py-3 px-2 rounded-xl border text-xs font-black cursor-pointer text-center transition-all ${draftAdapterType === LLMType.GEMINI ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-extrabold shadow-md' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-350 hover:bg-slate-900/60'}`}
          >
            기본 Gemini 어댑터
          </button>
          <button
            type="button"
            id="settings_adapter_tab_ollama"
            onClick={() => {
              setDraftAdapterType(LLMType.OLLAMA);
              applyLocalPreset("ollama");
            }}
            className={`py-3 px-2 rounded-xl border text-xs font-black cursor-pointer text-center transition-all ${draftAdapterType === LLMType.OLLAMA ? 'border-teal-500 bg-teal-500/15 text-teal-400 font-extrabold shadow-md' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-350 hover:bg-slate-900/60'}`}
          >
            로컬 데스크톱 LLM 어댑터
          </button>
          <button
            type="button"
            id="settings_adapter_tab_custom"
            onClick={() => {
              setDraftAdapterType(LLMType.CUSTOM);
              applyOtherPreset("openai");
            }}
            className={`py-3 px-2 rounded-xl border text-xs font-black cursor-pointer text-center transition-all ${draftAdapterType === LLMType.CUSTOM ? 'border-indigo-500 bg-indigo-500/15 text-indigo-405 font-extrabold shadow-md' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-350 hover:bg-slate-900/60'}`}
          >
            기타 타사 클라우드 API
          </button>
        </div>

        {/* Gemini Explanation */}
        {draftAdapterType === LLMType.GEMINI && (
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 space-y-2">
            <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <span>🌟 Gemini 인프라 공유 기본 탑재 모델</span>
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              WizMasia Cloud에서 기본 제공하는 공유 자원을 점유 호출합니다. 별도의 개인 API Key 세팅을 할 필요 없이 즉시 기동 가능하지만, 타 사용자와 트래픽 공유로 인하여 일시적 429 Quota Alert 한도 초과 오류가 노출될 수 있습니다.
            </p>
          </div>
        )}

        {/* Local Ollama preset configuration */}
        {draftAdapterType === LLMType.OLLAMA && (
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-350">
              <span className="font-black text-teal-400">🖥️ 로컬 데스크톱 서비스 어레인지 선택:</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-1">
              <button
                type="button"
                onClick={() => applyLocalPreset("ollama")}
                className={`py-2.5 px-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${localPreset === 'ollama' ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-black' : 'border-slate-800 bg-slate-905 text-slate-400 hover:text-slate-300'}`}
              >
                Ollama 프리셋
              </button>
              <button
                type="button"
                onClick={() => applyLocalPreset("lmstudio")}
                className={`py-2.5 px-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${localPreset === 'lmstudio' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-305 font-black' : 'border-slate-800 bg-slate-905 text-slate-400 hover:text-slate-300'}`}
              >
                LM Studio 프리셋
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-bold">로컬 호스트 주소 (Endpoint Host)</label>
                <input
                  type="text"
                  value={draftCustomEndpoint}
                  onChange={(e) => setDraftCustomEndpoint(e.target.value)}
                  placeholder={localPreset === 'ollama' ? 'http://localhost:11434/v1' : 'http://localhost:1234/v1'}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] text-slate-350 font-bold">로컬 적재 모델 (Model ID)</label>
                  <button
                    type="button"
                    onClick={onFetchModels}
                    disabled={fetchModelsLoading}
                    className="py-1 px-2.5 rounded-md bg-[#1d273a] border border-indigo-500/20 text-[10px] text-indigo-300 hover:bg-[#27354f] hover:text-indigo-100 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {fetchModelsLoading ? "조회 중..." : "🔄 가용 로컬 모델 목록 확인"}
                  </button>
                </div>

                {fetchModelsError && (
                  <p className="p-2 rounded bg-rose-950/40 border border-rose-900/40 text-[10.5px] text-rose-450 leading-normal font-semibold">
                    ⚠️ {fetchModelsError}
                  </p>
                )}

                {fetchedModels.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={draftCustomModel}
                      onChange={(e) => setDraftCustomModel(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-teal-500/40 text-xs text-teal-400 focus:ring-1 focus:ring-amber-500 font-extrabold cursor-pointer"
                    >
                      {fetchedModels.map((m) => (
                        <option key={m} value={m} className="bg-slate-950 text-slate-300 font-mono">
                          {m}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-teal-500/80">&bull; 활성 PC로부터 검색 완료된 {fetchedModels.length}개의 가용 모델을 탑재했습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={draftCustomModel}
                      onChange={(e) => setDraftCustomModel(e.target.value)}
                      placeholder={localPreset === 'ollama' ? 'gemma2:9b' : 'gemma-2-9b-it'}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-500">&bull; 원하시는 모델명이 모델 목록 가져오기 전인 경우 직접 기입해 주셔도 됩니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other Engine details configuration with OpenAI and OpenRouter preset selector */}
        {draftAdapterType === LLMType.CUSTOM && (
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-350">
              <span className="font-black text-indigo-400">🌐 클라우드 외부 서비스 프리셋 선택:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pb-2">
              <button
                type="button"
                onClick={() => applyOtherPreset("openai")}
                className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all ${otherPreset === 'openai' ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-300'}`}
              >
                OpenAI
              </button>
              <button
                type="button"
                onClick={() => applyOtherPreset("openrouter")}
                className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all ${otherPreset === 'openrouter' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-300'}`}
              >
                OpenRouter
              </button>
              <button
                type="button"
                onClick={() => applyOtherPreset("custom")}
                className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all ${otherPreset === 'custom' ? 'border-slate-500 bg-slate-500/10 text-slate-300' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-300'}`}
              >
                직접기입 (Custom)
              </button>
            </div>

            {/* Preset Information / Disclaimer */}
            <div className="p-3.5 rounded-xl bg-[#121626] border border-indigo-500/10 text-xs text-slate-300 leading-relaxed font-semibold">
              {otherPreset === "openai" && (
                <div className="text-amber-400 flex items-start gap-1.5">
                  <HelpCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>기본 제공: OpenAI GPT-4o-mini 프리셋이 선택되었습니다. 호스팅 통신 인가를 위해 본인의 OpenAI Key를 하단에 기재해 주셔야 합니다.</span>
                </div>
              )}
              {otherPreset === "openrouter" && (
                <div className="text-indigo-400 flex items-start gap-1.5">
                  <HelpCircle className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                  <span>기본 제공: OpenRouter Free Model 프리셋이 선택되었습니다. API Key 필수 기입이 필요합니다.</span>
                </div>
              )}
              {otherPreset === "custom" && (
                <div className="text-rose-450 flex items-start gap-1.5">
                  <HelpCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>⚠️ OpenAI 및 OpenRouter 이외의 타사 OpenAI 호환 클라우드 LLM 서비스를 연동하시는 경우, 직접 엔드포인트 URL과 지정 모델 ID, API Key를 입력해주셔야 정상 연동됩니다.</span>
                </div>
              )}
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-bold flex items-center justify-between">
                  <span>엔드포인트 주소 (Endpoint Host URL)</span>
                  <span className="text-[10px] text-indigo-400 font-mono italic">
                    {otherPreset === 'openai' ? '기본: https://api.openai.com/v1' : (otherPreset === 'openrouter' ? '기본: https://openrouter.ai/api/v1' : '사용자 입력')}
                  </span>
                </label>
                <input
                  type="text"
                  value={draftCustomEndpoint}
                  onChange={(e) => setDraftCustomEndpoint(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-700 focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-bold">인증 권한 토큰 API Key</label>
                <input
                  type="password"
                  value={draftCustomApiKey}
                  onChange={(e) => setDraftCustomApiKey(e.target.value)}
                  placeholder={otherPreset === 'openai' ? 'sk-...' : 'OpenRouter API Key'}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-700 focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-900 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] text-slate-350 font-bold">지정 모델 ID (Model ID)</label>
                  <button
                    type="button"
                    onClick={onFetchModels}
                    disabled={fetchModelsLoading}
                    className="py-1 px-2.5 rounded-md bg-[#1d273a] border border-indigo-500/20 text-[10px] text-indigo-300 hover:bg-[#27354f] hover:text-indigo-100 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {fetchModelsLoading ? "조회 중..." : "🔄 서비스 모델 목록 가져오기"}
                  </button>
                </div>

                {fetchModelsError && (
                  <p className="p-2 rounded bg-rose-950/40 border border-rose-900/40 text-[10.5px] text-rose-400 leading-normal">
                    ⚠️ {fetchModelsError}
                  </p>
                )}

                {fetchedModels.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={draftCustomModel}
                      onChange={(e) => setDraftCustomModel(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-indigo-500/35 text-xs text-teal-400 focus:ring-1 focus:ring-amber-500 font-extrabold cursor-pointer"
                    >
                      {fetchedModels.map((m) => (
                        <option key={m} value={m} className="bg-slate-950 text-slate-300 font-mono">
                          {m}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-teal-500/80">&bull; 활성 API 서버로부터 검색 완료된 {fetchedModels.length}개의 가용 모델을 탑재했습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={draftCustomModel}
                      onChange={(e) => setDraftCustomModel(e.target.value)}
                      placeholder={otherPreset === 'openai' ? 'gpt-4o-mini' : (otherPreset === 'openrouter' ? 'openrouter/free' : 'google/gemini-2.5-flash')}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-505 font-medium">&bull; 각 제공업체의 모델 명명 규칙에 맞춥니다 (gpt-4o, openrouter/free 등).</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Premium Saving Button Panel at bottom */}
        <div className="pt-4 border-t border-slate-900 flex flex-col items-center gap-3">
          {settingsSavedSuccess && (
            <div id="settings_save_toast_banner" className="w-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex gap-2 animate-pulse leading-normal font-bold">
              <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
              <span>🎉 환경설정이 브라우저 보존 공간에 성공적으로 기입되었습니다. 모든 가동 컴플라이언스 엔진 대조 연산 시 저장된 복합 어댑터 규칙이 즉각 연동 적용됩니다.</span>
            </div>
          )}
          
          <button
            type="button"
            id="settings_save_button"
            onClick={onSave}
            className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition-all cursor-pointer text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Save className="w-4 h-4" />
            <span>환경설정 저장하기 (Save Configurations)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
