/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { LLMType } from '../types';
import { apiClient } from '../services/api';

export interface AppContextType {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  fontSize: 'sm' | 'md' | 'lg';
  setFontSize: React.Dispatch<React.SetStateAction<'sm' | 'md' | 'lg'>>;
  activeTab: 'review' | 'about' | 'benchmark' | 'history' | 'settings';
  setActiveTab: React.Dispatch<React.SetStateAction<'review' | 'about' | 'benchmark' | 'history' | 'settings'>>;

  // LLM Configurations
  adapterType: LLMType;
  setAdapterType: React.Dispatch<React.SetStateAction<LLMType>>;
  customModel: string;
  setCustomModel: React.Dispatch<React.SetStateAction<string>>;
  customEndpoint: string;
  setCustomEndpoint: React.Dispatch<React.SetStateAction<string>>;
  customApiKey: string;
  setCustomApiKey: React.Dispatch<React.SetStateAction<string>>;

  // Saved presets
  localPreset: string;
  setLocalPreset: React.Dispatch<React.SetStateAction<string>>;
  otherPreset: string;
  setOtherPreset: React.Dispatch<React.SetStateAction<string>>;
  settingsSavedSuccess: boolean;
  setSettingsSavedSuccess: React.Dispatch<React.SetStateAction<boolean>>;

  // Custom API Model Loader States
  fetchedModels: string[];
  setFetchedModels: React.Dispatch<React.SetStateAction<string[]>>;
  fetchModelsLoading: boolean;
  setFetchModelsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchModelsError: string | null;
  setFetchModelsError: React.Dispatch<React.SetStateAction<string | null>>;

  // Event handlers
  handleSaveSettings: (config: { adapterType: LLMType; customModel: string; customEndpoint: string; customApiKey: string; localPreset: string; otherPreset: string }) => void;
  handleFetchModels: (endpoint: string, apiKey: string) => Promise<string[] | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [activeTab, setActiveTab] = useState<'review' | 'about' | 'benchmark' | 'history' | 'settings'>('review');

  const [adapterType, setAdapterType] = useState<LLMType>(LLMType.GEMINI);
  const [customModel, setCustomModel] = useState<string>('gemini-3.5-flash');
  const [customEndpoint, setCustomEndpoint] = useState<string>('');
  const [customApiKey, setCustomApiKey] = useState<string>('');

  const [localPreset, setLocalPreset] = useState<string>('ollama');
  const [otherPreset, setOtherPreset] = useState<string>('openai');
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState<boolean>(false);

  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchModelsLoading, setFetchModelsLoading] = useState<boolean>(false);
  const [fetchModelsError, setFetchModelsError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('COMPLIANCE_LLM_SETTINGS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.adapterType) setAdapterType(parsed.adapterType);
        if (parsed.customModel) setCustomModel(parsed.customModel);
        if (parsed.customEndpoint !== undefined) setCustomEndpoint(parsed.customEndpoint);
        if (parsed.customApiKey !== undefined) setCustomApiKey(parsed.customApiKey);
        if (parsed.localPreset) setLocalPreset(parsed.localPreset);
        if (parsed.otherPreset) setOtherPreset(parsed.otherPreset);
      } catch (err) {
        console.warn('Failed to retrieve stored LLM settings:', err);
      }
    }
  }, []);

  const handleSaveSettings = (config: { adapterType: LLMType; customModel: string; customEndpoint: string; customApiKey: string; localPreset: string; otherPreset: string }) => {
    setAdapterType(config.adapterType);
    setCustomModel(config.customModel);
    setCustomEndpoint(config.customEndpoint);
    setCustomApiKey(config.customApiKey);
    setLocalPreset(config.localPreset);
    setOtherPreset(config.otherPreset);

    localStorage.setItem('COMPLIANCE_LLM_SETTINGS', JSON.stringify(config));

    setSettingsSavedSuccess(true);
    setTimeout(() => setSettingsSavedSuccess(false), 4000);
  };

  const handleFetchModels = async (endpoint: string, apiKey: string) => {
    setFetchModelsLoading(true);
    setFetchModelsError(null);
    setFetchedModels([]);

    const ep = endpoint && endpoint.trim() ? endpoint.trim() : 'http://localhost:11434/v1';
    const cleanEp = ep.endsWith('/') ? ep.slice(0, -1) : ep;
    const isLocalhost = ep.includes('localhost') || ep.includes('127.0.0.1');

    if (isLocalhost) {
      try {
        const directRes = await fetch(`${cleanEp}/models`, {
          method: 'GET',
          headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : undefined,
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData && Array.isArray(directData.data)) {
            const list = directData.data.map((m: any) => m.id);
            if (list.length > 0) {
              setFetchedModels(list);
              setFetchModelsLoading(false);
              return list;
            }
          }
        }

        const hostPort = cleanEp.replace(/\/v1$/, '');
        const tagsRes = await fetch(`${hostPort}/api/tags`);
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          if (tagsData && Array.isArray(tagsData.models)) {
            const list = tagsData.models.map((m: any) => m.name || m.model);
            if (list.length > 0) {
              setFetchedModels(list);
              setFetchModelsLoading(false);
              return list;
            }
          }
        }
      } catch (clientErr) {
        console.warn('Client-side direct localhost check failed. Falling back to server:', clientErr);
      }
    }

    try {
      const data = await apiClient.fetchProxyModels(ep, apiKey);
      if (data.success && Array.isArray(data.models)) {
        setFetchedModels(data.models);
        setFetchModelsLoading(false);
        return data.models;
      } else {
        setFetchModelsError(data.message || '모델 목록을 조회하지 못했습니다. 엔드포인트 응답 상태와 서버가 켜져 있는지 확인하십시오.');
      }
    } catch (err: any) {
      let errMsg = err.message || '서버 통신 중 오류가 발생했습니다. 해당 주소로의 접근이 올바른지 확인하십시오.';
      if (isLocalhost) {
        errMsg += `\n\n💡 [접근 꿀팁] 현재 이 빌드 환경은 클라우드 가상화 샌드박스로 구동되므로, 클라우드 서버 측에서는 사용자의 '개인 PC(localhost/127.0.0.1)'에 접촉할 수 없습니다. 상단의 [Export ZIP] 혹은 다운로드 메뉴를 눌러 소스코드를 로컬에서 기동(npm run dev)하시면 상호 연결이 완전히 가능해집니다. 현재 상태에서 테스트하시려면, 일반 텍스트나 Gemini 모드를 선호하여 주십시오.`;
      }
      setFetchModelsError(errMsg);
    } finally {
      setFetchModelsLoading(false);
    }
    return null;
  };

  const value: AppContextType = {
    darkMode,
    setDarkMode,
    fontSize,
    setFontSize,
    activeTab,
    setActiveTab,
    adapterType,
    setAdapterType,
    customModel,
    setCustomModel,
    customEndpoint,
    setCustomEndpoint,
    customApiKey,
    setCustomApiKey,
    localPreset,
    setLocalPreset,
    otherPreset,
    setOtherPreset,
    settingsSavedSuccess,
    setSettingsSavedSuccess,
    fetchedModels,
    setFetchedModels,
    fetchModelsLoading,
    setFetchModelsLoading,
    fetchModelsError,
    setFetchModelsError,
    handleSaveSettings,
    handleFetchModels,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
