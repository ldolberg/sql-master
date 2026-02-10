
import React, { useState } from 'react';
import { ShieldCheck, Cpu, Database, Eye, EyeOff, Info } from 'lucide-react';
import { SqlDialect } from '../types';

interface SettingsPanelProps {
  config: {
    openaiKey: string;
    anthropicKey: string;
    geminiModel: string;
    dialect: SqlDialect;
  };
  onUpdate: (updates: Partial<SettingsPanelProps['config']>) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onUpdate }) => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const dialects: SqlDialect[] = ['PostgreSQL', 'MySQL', 'SQLite', 'Snowflake', 'BigQuery', 'Redshift'];

  return (
    <div className="flex-1 bg-[#252526] p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-1 text-white">Settings</h2>
          <p className="text-xs text-[#858585]">Configure your SQL workspace and AI providers.</p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-[#cccccc] font-medium border-b border-[#333333] pb-2">
            <Cpu size={18} />
            <h3>LLM Providers</h3>
          </div>

          {/* Gemini Config - Special Handling */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-[#bbbbbb] uppercase">Google Gemini</label>
            <div className="bg-[#1e1e1e] p-3 rounded border border-[#333333] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={14} className="text-green-500" />
                  <span className="text-xs text-[#cccccc]">API Key: <span className="text-green-500/80">System Managed</span></span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-[#858585]">
                  <Info size={12} />
                  <span>Configured via secure environment</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[#858585]">Active Model</span>
                <select 
                  value={config.geminiModel}
                  onChange={(e) => onUpdate({ geminiModel: e.target.value })}
                  className="w-full bg-[#3c3c3c] border border-transparent focus:border-[#007acc] rounded px-2 py-1 text-xs text-[#cccccc] outline-none"
                >
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast)</option>
                  <option value="gemini-3-pro-preview">Gemini 3 Pro (High Intelligence)</option>
                </select>
              </div>
            </div>
          </div>

          {/* OpenAI Config */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-[#bbbbbb] uppercase">OpenAI</label>
            <div className="relative">
              <input
                type={showKeys['openai'] ? 'text' : 'password'}
                placeholder="sk-..."
                value={config.openaiKey}
                onChange={(e) => onUpdate({ openaiKey: e.target.value })}
                className="w-full bg-[#3c3c3c] border border-transparent focus:border-[#007acc] rounded px-3 py-1.5 text-xs text-[#cccccc] outline-none font-mono"
              />
              <button 
                onClick={() => toggleVisibility('openai')}
                className="absolute right-2 top-1.5 text-[#858585] hover:text-white"
              >
                {showKeys['openai'] ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Anthropic Config */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-[#bbbbbb] uppercase">Anthropic</label>
            <div className="relative">
              <input
                type={showKeys['anthropic'] ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={config.anthropicKey}
                onChange={(e) => onUpdate({ anthropicKey: e.target.value })}
                className="w-full bg-[#3c3c3c] border border-transparent focus:border-[#007acc] rounded px-3 py-1.5 text-xs text-[#cccccc] outline-none font-mono"
              />
              <button 
                onClick={() => toggleVisibility('anthropic')}
                className="absolute right-2 top-1.5 text-[#858585] hover:text-white"
              >
                {showKeys['anthropic'] ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-[#cccccc] font-medium border-b border-[#333333] pb-2">
            <Database size={18} />
            <h3>Database Configuration</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-[#858585]">Dialect</span>
              <select 
                value={config.dialect}
                onChange={(e) => onUpdate({ dialect: e.target.value as SqlDialect })}
                className="w-full bg-[#3c3c3c] border border-transparent focus:border-[#007acc] rounded px-2 py-1 text-xs text-[#cccccc] outline-none"
              >
                {dialects.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[#858585]">Environment</span>
              <select className="w-full bg-[#3c3c3c] border border-transparent focus:border-[#007acc] rounded px-2 py-1 text-xs text-[#cccccc] outline-none">
                <option>Production</option>
                <option>Staging</option>
                <option>Development</option>
              </select>
            </div>
          </div>
        </section>

        <div className="pt-4 border-t border-[#333333] flex justify-end">
           <p className="text-[10px] text-[#858585]">Settings are saved locally to your workspace session.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
