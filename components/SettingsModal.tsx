
import React, { useState } from 'react';
import { ChatConfig } from '../types';
import { ICONS } from '../constants';

interface SettingsModalProps {
  config: ChatConfig;
  onSave: (config: ChatConfig) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState<ChatConfig>({ 
    ...config,
    apiKeys: config.apiKeys || [],
    baseUrl: config.baseUrl || ""
  });
  const [newKey, setNewKey] = useState("");

  const handleAddKey = () => {
    if (newKey.trim()) {
      setLocalConfig({
        ...localConfig,
        apiKeys: [...(localConfig.apiKeys || []), newKey.trim()]
      });
      setNewKey("");
    }
  };

  const removeKey = (index: number) => {
    const updated = (localConfig.apiKeys || []).filter((_, i) => i !== index);
    setLocalConfig({ ...localConfig, apiKeys: updated });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/50 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <ICONS.Settings /> 系统配置
            </h2>
            <p className="text-xs text-slate-500 mt-1">配置您的 API 节点与密钥</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Endpoint Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ICONS.Globe /> API Base URL
              </label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                value={localConfig.baseUrl}
                onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
                placeholder="留空使用 Google 原生接口"
              />
            </section>
            <section className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ICONS.Bot /> 模型名称
              </label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={localConfig.modelName}
                onChange={(e) => setLocalConfig({ ...localConfig, modelName: e.target.value })}
                placeholder="gemini-2.0-flash"
              />
            </section>
          </div>

          {/* API Keys */}
          <section className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ICONS.Key /> API 密钥 (支持多 Key 轮询)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="在此输入新的 Key..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
              />
              <button 
                onClick={handleAddKey}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl flex items-center gap-2 transition-all active:scale-95 font-bold text-sm"
              >
                <ICONS.Plus /> 添加
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-3">
              {(localConfig.apiKeys || []).length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-2xl text-slate-600 text-xs">
                  暂无已添加的密钥
                </div>
              )}
              {(localConfig.apiKeys || []).map((key, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950/50 border border-slate-800 px-4 py-3 rounded-xl group hover:border-slate-600 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="font-mono text-xs text-slate-400 uppercase tracking-tight">
                      {key.slice(0, 8)} •••• {key.slice(-8)}
                    </span>
                  </div>
                  <button onClick={() => removeKey(idx)} className="text-slate-600 hover:text-red-400 p-1 transition-colors">
                    <ICONS.Trash />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* System Instruction */}
          <section className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">系统提示词 (System Role)</label>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 h-28 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all custom-scrollbar"
              value={localConfig.systemInstruction}
              onChange={(e) => setLocalConfig({ ...localConfig, systemInstruction: e.target.value })}
              placeholder="设定 AI 的身份和行为准则..."
            />
          </section>
        </div>

        <div className="p-8 border-t border-slate-800 flex justify-end gap-4 bg-slate-900/80">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button 
            onClick={() => { onSave(localConfig); onClose(); }}
            className="px-10 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
          >
            确认并保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
