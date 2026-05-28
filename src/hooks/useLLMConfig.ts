/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { LLMType } from '../types';
import { apiClient } from '../services/api';

export function useLLMConfig() {
  // Adapter Multi-LLM Config - default to Gemini with flash
  const [adapterType, setAdapterType] = useState<LLMType>(LLMType.GEMINI);
  const [customModel, setCustomModel] = useState<string>("gemini-3.5-flash");
  const [customEndpoint, setCustomEndpoint] = useState<string>("");
  const [customApiKey, setCustomApiKey] = useState<string>("");

  // Saved presets / states
  const [localPreset, setLocalPreset] = useState<string>("ollama"); // "ollama" | "lmstudio"
  const [otherPreset, setOtherPreset] = useState<string>("openai"); // "openai" | "openrouter" | "custom"
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState<boolean>(false);

  // Draft editing states (unsaved states inside Settings UI, applied to active states on 'Save')
  const [draftAdapterType, setDraftAdapterType] = useState<LLMType>(LLMType.GEMINI);
  const [draftCustomModel, setDraftCustomModel] = useState<string>("gemini-3.5-flash");
  const [draftCustomEndpoint, setDraftCustomEndpoint] = useState<string>("");
  const [draftCustomApiKey, setDraftCustomApiKey] = useState<string>("");
  
  // Custom API Model Loader States
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchModelsLoading, setFetchModelsLoading] = useState<boolean>(false);
  const [fetchModelsError, setFetchModelsError] = useState<string | null>(null);

  // Load LLM configuration settings from localStorage once upon mounting
  useEffect(() => {
    const saved = localStorage.getItem("COMPLIANCE_LLM_SETTINGS");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.adapterType) {
          setAdapterType(parsed.adapterType);
          setDraftAdapterType(parsed.adapterType);
        }
        if (parsed.customModel) {
          setCustomModel(parsed.customModel);
          setDraftCustomModel(parsed.customModel);
        }
        if (parsed.customEndpoint !== undefined) {
          setCustomEndpoint(parsed.customEndpoint);
          setDraftCustomEndpoint(parsed.customEndpoint);
        }
        if (parsed.customApiKey !== undefined) {
          setCustomApiKey(parsed.customApiKey);
          setDraftCustomApiKey(parsed.customApiKey);
        }
        if (parsed.localPreset) {
          setLocalPreset(parsed.localPreset);
        }
        if (parsed.otherPreset) {
          setOtherPreset(parsed.otherPreset);
        }
      } catch (err) {
        console.warn("Failed to retrieve or parse stored LLM settings:", err);
      }
    }
  }, []);

  const handleSaveSettings = () => {
    // Apply draft configurations to active session configurations
    setAdapterType(draftAdapterType);
    setCustomModel(draftCustomModel);
    setCustomEndpoint(draftCustomEndpoint);
    setCustomApiKey(draftCustomApiKey);

    // Save to browser's client-side persistent storage (localStorage)
    const configToSave = {
      adapterType: draftAdapterType,
      customModel: draftCustomModel,
      customEndpoint: draftCustomEndpoint,
      customApiKey: draftCustomApiKey,
      localPreset: localPreset,
      otherPreset: otherPreset
    };
    localStorage.setItem("COMPLIANCE_LLM_SETTINGS", JSON.stringify(configToSave));

    // Show visual indicator
    setSettingsSavedSuccess(true);
    setTimeout(() => {
      setSettingsSavedSuccess(false);
    }, 4000);
  };

  const applyLocalPreset = (preset: "ollama" | "lmstudio") => {
    setLocalPreset(preset);
    if (preset === "ollama") {
      setDraftCustomEndpoint("http://localhost:11434/v1");
      setDraftCustomModel("gemma2:9b");
    } else {
      setDraftCustomEndpoint("http://localhost:1234/v1");
      setDraftCustomModel("gemma-2-9b-it");
    }
    setFetchedModels([]);
  };

  const applyOtherPreset = (preset: "openai" | "openrouter" | "custom") => {
    setOtherPreset(preset);
    if (preset === "openai") {
      setDraftCustomEndpoint("https://api.openai.com/v1");
      setDraftCustomModel("gpt-4o-mini");
    } else if (preset === "openrouter") {
      setDraftCustomEndpoint("https://openrouter.ai/api/v1");
      setDraftCustomModel("google/gemini-2.5-flash");
    } else {
      setDraftCustomEndpoint("");
      setDraftCustomModel("");
    }
    setFetchedModels([]);
  };

  const handleFetchModels = async () => {
    setFetchModelsLoading(true);
    setFetchModelsError(null);
    setFetchedModels([]);
    
    const ep = draftCustomEndpoint && draftCustomEndpoint.trim() ? draftCustomEndpoint.trim() : "http://localhost:11434/v1";
    const cleanEp = ep.endsWith('/') ? ep.slice(0, -1) : ep;
    const isLocalhost = ep.includes("localhost") || ep.includes("127.0.0.1");

    if (isLocalhost) {
      // 💡 Client-side direct connection attempt for local desktop LLM servers
      try {
        // A. Try /v1/models (Standard OpenAI compatibility)
        const directRes = await fetch(`${cleanEp}/models`, {
          method: 'GET',
          headers: draftCustomApiKey ? { 'Authorization': `Bearer ${draftCustomApiKey}` } : undefined
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData && Array.isArray(directData.data)) {
            const list = directData.data.map((m: any) => m.id);
            if (list.length > 0) {
              setFetchedModels(list);
              setDraftCustomModel(list[0]);
              setFetchModelsLoading(false);
              return;
            }
          }
        }

        // B. Fallback to raw /api/tags if no /v1 was attached
        const hostPort = cleanEp.replace(/\/v1$/, '');
        const tagsRes = await fetch(`${hostPort}/api/tags`);
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          if (tagsData && Array.isArray(tagsData.models)) {
            const list = tagsData.models.map((m: any) => m.name || m.model);
            if (list.length > 0) {
              setFetchedModels(list);
              setDraftCustomModel(list[0]);
              setFetchModelsLoading(false);
              return;
            }
          }
        }
      } catch (clientErr: any) {
        console.warn("Client-side direct localhost check failed or CORS blocked. Falling back to server-side query:", clientErr);
      }
    }
    
    try {
      const data = await apiClient.fetchProxyModels(ep, draftCustomApiKey);
      if (data.success && Array.isArray(data.models)) {
        setFetchedModels(data.models);
        if (data.models.length > 0) {
          setDraftCustomModel(data.models[0]);
        }
      } else {
        setFetchModelsError(data.message || "모델 목록을 조회하지 못했습니다. 엔드포인트 응답 상태와 서버가 켜져 있는지 확인하십시오.");
      }
    } catch (err: any) {
      let errMsg = err.message || "서버 통신 중 오류가 발생했습니다. 해당 주소로의 접근이 올바른지 확인하십시오.";
      if (isLocalhost) {
        errMsg += `\n\n💡 [접근 꿀팁] 현재 이 빌드 환경은 클라우드 가상화 샌드박스로 구동되므로, 클라우드 서버 측에서는 사용자의 '개인 PC(localhost/127.0.0.1)'에 접촉할 수 없습니다. 상단의 [Export ZIP] 혹은 다운로드 메뉴를 눌러 소스코드를 로컬에서 기동(npm run dev)하시면 상호 연결이 완전히 가능해집니다. 현재 상태에서 테스트하시려면, 일반 텍스트나 Gemini 모드를 선호하여 주십시오.`;
      }
      setFetchModelsError(errMsg);
    } finally {
      setFetchModelsLoading(false);
    }
  };

  return {
    adapterType,
    setAdapterType,
    customModel,
    setCustomModel,
    customEndpoint,
    setCustomEndpoint,
    customApiKey,
    setCustomApiKey,
    draftAdapterType,
    setDraftAdapterType,
    draftCustomModel,
    setDraftCustomModel,
    draftCustomEndpoint,
    setDraftCustomEndpoint,
    draftCustomApiKey,
    setDraftCustomApiKey,
    localPreset,
    setLocalPreset,
    otherPreset,
    setOtherPreset,
    fetchedModels,
    setFetchedModels,
    fetchModelsLoading,
    setFetchModelsLoading,
    fetchModelsError,
    setFetchModelsError,
    settingsSavedSuccess,
    setSettingsSavedSuccess,
    handleSaveSettings,
    applyLocalPreset,
    applyOtherPreset,
    handleFetchModels
  };
}
