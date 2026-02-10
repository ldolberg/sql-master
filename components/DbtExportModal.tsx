
import React, { useState } from 'react';
import { X, Copy, Check, FileCode, FileText } from 'lucide-react';

interface DbtExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { modelSql: string, schemaYaml: string } | null;
  modelName: string;
}

const DbtExportModal: React.FC<DbtExportModalProps> = ({ isOpen, onClose, data, modelName }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'yml'>('sql');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = activeTab === 'sql' ? data?.modelSql : data?.schemaYaml;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fileName = activeTab === 'sql' ? `${modelName.toLowerCase().replace(/\s+/g, '_')}.sql` : 'schema.yml';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#252526] w-full max-w-4xl max-h-[85vh] rounded-lg shadow-2xl flex flex-col border border-[#333333] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333333] bg-[#2d2d2d]">
          <div className="flex items-center space-x-2">
            <div className="bg-[#ff694b] p-1.5 rounded text-white">
              <FileCode size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Export as dbt Model</h3>
              <p className="text-[10px] text-[#858585]">Production-ready SQL & Schema configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#858585] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
          {/* Tabs */}
          <div className="flex items-center px-4 bg-[#252526] border-b border-[#333333]">
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'sql' ? 'border-[#007acc] text-white bg-[#1e1e1e]' : 'border-transparent text-[#858585] hover:text-[#cccccc]'
              }`}
            >
              <FileCode size={14} />
              <span>{modelName.toLowerCase().replace(/\s+/g, '_')}.sql</span>
            </button>
            <button
              onClick={() => setActiveTab('yml')}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'yml' ? 'border-[#007acc] text-white bg-[#1e1e1e]' : 'border-transparent text-[#858585] hover:text-[#cccccc]'
              }`}
            >
              <FileText size={14} />
              <span>schema.yml</span>
            </button>
            
            <div className="flex-1" />
            
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1 text-[10px] bg-[#3a3d41] hover:bg-[#45494e] text-white rounded transition-colors"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Code Body */}
          <div className="flex-1 overflow-auto p-6 font-mono text-sm leading-relaxed">
            {data ? (
              <pre className="text-[#d4d4d4] whitespace-pre-wrap break-words">
                {activeTab === 'sql' ? data.modelSql : data.schemaYaml}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-[#858585]">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-12 h-1 bg-[#007acc] rounded mb-4" />
                  Generating dbt files...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#2d2d2d] border-t border-[#333333] flex justify-between items-center">
          <p className="text-[10px] text-[#858585]">
            <span className="text-[#007acc] font-bold">Pro Tip:</span> dbt models use CTEs and modular YAML files for better maintainability.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-[#007acc] hover:bg-[#118ad4] text-white rounded transition-colors shadow-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DbtExportModal;
