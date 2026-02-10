
import React, { useState, useEffect } from 'react';
import { SQLSnippet, QueryResult, SafetyCheck, LintResult, ExecutionHistory, SqlDialect } from './types';
import Sidebar from './components/Sidebar';
import SnippetExplorer from './components/SnippetExplorer';
import ResultPanel from './components/ResultPanel';
import SettingsPanel from './components/SettingsPanel';
import DbtExportModal from './components/DbtExportModal';
import TestDashboard from './components/TestDashboard';
import ChatPanel from './components/ChatPanel';
import { executeSql } from './services/sqlRunner';
import { autoTagSnippet, checkSqlSafety, semanticSearch, generateDbtModel, lintAndFormatSql, initializeChat } from './services/geminiService';
import { 
  Play, 
  Save, 
  Trash2, 
  ShieldAlert, 
  Lightbulb, 
  Search,
  Hash,
  Activity,
  Maximize2,
  Minimize2,
  Box,
  Wand2,
  AlertCircle,
  CheckCircle2,
  History,
  Terminal,
  Clock,
  ExternalLink,
  RotateCw,
  Beaker,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  MessageSquareText
} from 'lucide-react';

const App: React.FC = () => {
  const [snippets, setSnippets] = useState<SQLSnippet[]>([]);
  const [history, setHistory] = useState<ExecutionHistory[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'search' | 'history' | 'settings' | 'tests' | 'chat'>('files');
  const [sqlCode, setSqlCode] = useState('');
  const [snippetName, setSnippetName] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLinting, setIsLinting] = useState(false);
  const [safetyInfo, setSafetyInfo] = useState<SafetyCheck | null>(null);
  const [lintInfo, setLintInfo] = useState<LintResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SQLSnippet[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editorMinimized, setEditorMinimized] = useState(false);
  
  // Safety Approval State
  const [showSafetyApproval, setShowSafetyApproval] = useState(false);
  const [isAnalyzingSafety, setIsAnalyzingSafety] = useState(false);

  // dbt Export State
  const [isExportingDbt, setIsExportingDbt] = useState(false);
  const [dbtExportData, setDbtExportData] = useState<{ modelSql: string, schemaYaml: string } | null>(null);
  const [showDbtModal, setShowDbtModal] = useState(false);

  // Configuration state
  const [appConfig, setAppConfig] = useState({
    openaiKey: '',
    anthropicKey: '',
    geminiModel: 'gemini-3-flash-preview',
    dialect: 'PostgreSQL' as SqlDialect
  });

  // Initialize with dummy data
  useEffect(() => {
    const initial: SQLSnippet[] = [
      {
        id: '1',
        name: 'Get All Active Users',
        code: 'SELECT * FROM users WHERE status = "active" ORDER BY created_at DESC;',
        tags: ['SELECT', 'users', 'filtering'],
        category: 'User Management',
        usageCount: 12,
        lastRunAt: Date.now() - 100000,
        createdAt: Date.now() - 1000000
      },
      {
        id: '2',
        name: 'Update Client Plan',
        code: 'UPDATE clients SET plan = "Enterprise" WHERE client_id = "C-123";',
        tags: ['UPDATE', 'clients', 'financials'],
        category: 'Billing',
        usageCount: 5,
        lastRunAt: Date.now() - 500000,
        createdAt: Date.now() - 2000000
      }
    ];
    setSnippets(initial);
    setActiveId(initial[0].id);
    setSqlCode(initial[0].code);
    setSnippetName(initial[0].name);
    initializeChat(appConfig.dialect);
  }, []);

  const handleSelectSnippet = (id: string) => {
    const snip = snippets.find(s => s.id === id);
    if (snip) {
      setActiveId(id);
      setSqlCode(snip.code);
      setSnippetName(snip.name);
      setSafetyInfo(null);
      setLintInfo(null);
      setShowSafetyApproval(false);
      if (['settings', 'tests', 'chat'].includes(activeTab)) setActiveTab('files');
    }
  };

  const handleNewSnippet = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newSnip: SQLSnippet = {
      id: newId,
      name: 'New Snippet',
      code: '-- Start typing SQL...',
      tags: [],
      category: 'General',
      usageCount: 0,
      lastRunAt: 0,
      createdAt: Date.now()
    };
    setSnippets([newSnip, ...snippets]);
    setActiveId(newId);
    setSqlCode(newSnip.code);
    setSnippetName(newSnip.name);
    setSafetyInfo(null);
    setLintInfo(null);
    setShowSafetyApproval(false);
    setActiveTab('files');
  };

  const handleDeleteSnippet = () => {
    if (!activeId) return;
    setSnippets(snippets.filter(s => s.id !== activeId));
    setActiveId(null);
    setSqlCode('');
    setSnippetName('');
    setLintInfo(null);
    setShowSafetyApproval(false);
  };

  const handleLintAndFormat = async () => {
    if (!sqlCode.trim()) return;
    setIsLinting(true);
    try {
      const result = await lintAndFormatSql(sqlCode, appConfig.dialect);
      setLintInfo(result);
      if (result.formattedCode) {
        setSqlCode(result.formattedCode);
      }
    } finally {
      setIsLinting(false);
    }
  };

  const isModificationQuery = (sql: string) => {
    const trimmed = sql.trim().toUpperCase();
    return trimmed.startsWith('UPDATE') || trimmed.startsWith('DELETE') || trimmed.startsWith('INSERT') || trimmed.startsWith('DROP') || trimmed.startsWith('TRUNCATE');
  };

  const runQuery = async (skipSafetyCheck = false) => {
    const code = sqlCode.trim();
    if (!code) return;
    
    const isMod = isModificationQuery(code);

    if (!skipSafetyCheck && isMod) {
      setIsAnalyzingSafety(true);
      try {
        const safety = await checkSqlSafety(code, appConfig.dialect);
        setSafetyInfo(safety);
        
        if (!safety.isSafe || safety.warnings.length > 0) {
          setShowSafetyApproval(true);
          setIsAnalyzingSafety(false);
          return;
        }
      } catch (err) {
        console.error("Safety check failed, proceeding with caution", err);
      } finally {
        setIsAnalyzingSafety(false);
      }
    }

    setIsExecuting(true);
    setShowSafetyApproval(false);
    try {
      const result = await executeSql(code, appConfig.dialect);
      setQueryResult(result);

      const historyEntry: ExecutionHistory = {
        id: Math.random().toString(36).substr(2, 9),
        snippetId: activeId,
        name: snippetName || 'Ad-hoc Query',
        code: code,
        timestamp: Date.now(),
        executionTime: result.executionTime
      };
      setHistory(prev => [historyEntry, ...prev]);

      if (activeId) {
        setSnippets(prev => prev.map(s => 
          s.id === activeId 
            ? { ...s, usageCount: s.usageCount + 1, lastRunAt: Date.now(), code: code } 
            : s
        ));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecuting(false);
    }
  };

  const saveSnippet = async () => {
    if (!activeId) return;
    setIsSaving(true);
    try {
      const { tags, category } = await autoTagSnippet(sqlCode, appConfig.dialect);
      setSnippets(prev => prev.map(s => 
        s.id === activeId 
          ? { ...s, name: snippetName, code: sqlCode, tags, category } 
          : s
      ));
    } finally {
      setIsSaving(false);
    }
  };

  const exportAsDbt = async () => {
    setDbtExportData(null);
    setShowDbtModal(true);
    setIsExportingDbt(true);
    try {
      const dbtData = await generateDbtModel(snippetName || "Untitled Model", sqlCode, appConfig.dialect);
      setDbtExportData(dbtData);
    } finally {
      setIsExportingDbt(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const matchedIds = await semanticSearch(searchQuery, snippets);
      const results = matchedIds
        .map(id => snippets.find(s => s.id === id))
        .filter((s): s is SQLSnippet => !!s);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const loadFromHistory = (entry: ExecutionHistory) => {
    setSqlCode(entry.code);
    setSnippetName(entry.name);
    if (entry.snippetId) {
      setActiveId(entry.snippetId);
    } else {
      setActiveId(null);
    }
    setQueryResult(null);
    setSafetyInfo(null);
    setLintInfo(null);
    setShowSafetyApproval(false);
  };

  const rerunFromHistory = (entry: ExecutionHistory) => {
    loadFromHistory(entry);
    setTimeout(() => {
      runQuery();
    }, 0);
  };

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-[#d4d4d4] overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onNewSnippet={handleNewSnippet} />

      <div className="w-64 md:w-80 bg-[#252526] border-r border-[#1e1e1e] flex flex-col">
        {activeTab === 'files' && (
          <SnippetExplorer 
            snippets={snippets} 
            selectedId={activeId} 
            onSelect={handleSelectSnippet} 
          />
        )}

        {activeTab === 'search' && (
          <div className="flex-1 p-4 flex flex-col space-y-4">
            <h2 className="text-xs font-bold uppercase text-[#bbbbbb] tracking-wider flex items-center">
              <Search size={14} className="mr-2" /> Semantic Search
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Find inconsistent client ids"
                className="w-full bg-[#3c3c3c] text-xs py-2 px-3 rounded border border-transparent focus:border-[#007acc] outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch()}
              />
              <button 
                onClick={performSearch}
                className="absolute right-2 top-1.5 text-[#858585] hover:text-white"
              >
                {isSearching ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Search size={16} />}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {searchResults.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSnippet(s.id)}
                  className="w-full text-left p-2 rounded bg-[#2a2d2e] hover:bg-[#37373d] transition-colors border-l-2 border-blue-500"
                >
                  <p className="text-xs font-semibold text-[#cccccc]">{s.name}</p>
                  <code className="text-[10px] text-[#858585] block mt-1 truncate">{s.code}</code>
                </button>
              ))}
              {!isSearching && searchQuery && searchResults.length === 0 && (
                <p className="text-[10px] text-center text-[#858585] pt-4 italic">No semantic matches found.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && <ChatPanel currentSql={sqlCode} dialect={appConfig.dialect} />}

        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#333333] bg-[#2d2d2d]">
              <h2 className="text-xs font-bold uppercase text-[#bbbbbb] tracking-wider flex items-center">
                <History size={14} className="mr-2" /> Execution History
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <div className="p-8 text-center text-[#858585] flex flex-col items-center">
                  <Clock size={32} className="opacity-20 mb-2" />
                  <p className="text-[10px]">No execution history yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#333333]">
                  {history.map((entry) => (
                    <div key={entry.id} className="p-3 hover:bg-[#2a2d2e] group transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-[#cccccc] truncate pr-2">
                          {entry.name}
                        </span>
                        <span className="text-[9px] text-[#858585] whitespace-nowrap">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-[9px] text-[#858585] mb-2">
                        <span className="flex items-center">
                          <Terminal size={10} className="mr-1" /> {entry.executionTime}ms
                        </span>
                      </div>
                      <code className="block text-[10px] text-[#6a9955] font-mono truncate mb-2 opacity-80 italic">
                        {entry.code.replace(/\s+/g, ' ')}
                      </code>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => loadFromHistory(entry)}
                          className="flex items-center space-x-1 px-2 py-0.5 bg-[#3c3c3c] hover:bg-[#45494e] text-white rounded text-[9px]"
                        >
                          <ExternalLink size={10} />
                          <span>Load</span>
                        </button>
                        <button
                          onClick={() => rerunFromHistory(entry)}
                          className="flex items-center space-x-1 px-2 py-0.5 bg-[#007acc] hover:bg-[#118ad4] text-white rounded text-[9px]"
                        >
                          <RotateCw size={10} />
                          <span>Re-run</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tests' && <TestDashboard />}

        {activeTab === 'settings' && (
          <div className="flex-1 p-4 border-b border-[#333333]">
             <h2 className="text-xs font-bold uppercase text-[#bbbbbb] tracking-wider flex items-center">
              Configuration Active
            </h2>
            <p className="text-[10px] text-[#858585] mt-2 italic">Editing global application settings.</p>
          </div>
        )}
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        {activeTab === 'settings' ? (
          <SettingsPanel 
            config={appConfig} 
            onUpdate={(updates) => setAppConfig(prev => ({ ...prev, ...updates }))} 
          />
        ) : activeTab === 'tests' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
             <Beaker size={64} className="text-[#007acc] mb-6 opacity-20" />
             <h1 className="text-xl font-bold text-[#cccccc] mb-2">Test Suite Explorer</h1>
             <p className="max-w-md text-sm text-[#858585]">
               This environment allows you to run unit and integration tests for AI-powered features. 
               Select a test in the explorer to see detailed assertions.
             </p>
          </div>
        ) : (
          <>
            <div className="h-12 bg-[#2d2d2d] flex items-center px-4 justify-between border-b border-[#1e1e1e]">
              <div className="flex items-center space-x-3 overflow-hidden">
                <input 
                  value={snippetName}
                  onChange={(e) => setSnippetName(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-[#cccccc] focus:outline-none focus:ring-1 focus:ring-[#007acc] px-2 py-1 rounded w-64"
                  placeholder="Snippet Name..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setActiveTab('chat')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 text-xs font-medium transition-colors"
                  title="Discuss this snippet with AI"
                >
                  <MessageSquareText size={14} />
                  <span className="hidden lg:inline">Ask AI</span>
                </button>
                <button 
                  onClick={handleLintAndFormat}
                  disabled={!sqlCode || isLinting}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#4ec9b0]/10 hover:bg-[#4ec9b0]/20 border border-[#4ec9b0]/30 rounded text-[#4ec9b0] text-xs font-medium transition-colors disabled:opacity-50"
                  title="Clean, Lint & Format with AI"
                >
                  <Wand2 size={14} className={isLinting ? "animate-pulse" : ""} />
                  <span className="hidden md:inline">{isLinting ? 'Cleaning...' : 'Clean'}</span>
                </button>
                <button 
                  onClick={exportAsDbt}
                  disabled={!sqlCode || isExecuting}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#ff694b]/10 hover:bg-[#ff694b]/20 border border-[#ff694b]/30 rounded text-[#ff694b] text-xs font-medium transition-colors disabled:opacity-50"
                  title="Export to dbt"
                >
                  <Box size={14} />
                  <span className="hidden md:inline">dbt</span>
                </button>
                <button 
                  onClick={() => runQuery()}
                  disabled={isExecuting || isAnalyzingSafety}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#007acc] hover:bg-[#118ad4] rounded text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <Play size={14} fill="currentColor" />
                  <span>{isExecuting ? 'Running...' : isAnalyzingSafety ? 'Checking Safety...' : 'Execute'}</span>
                </button>
                <button 
                  onClick={saveSnippet}
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#3a3d41] hover:bg-[#45494e] rounded text-white text-xs font-medium transition-colors"
                >
                  <Save size={14} />
                  <span>{isSaving ? 'Saving...' : 'Save & Tag'}</span>
                </button>
                <button 
                  onClick={handleDeleteSnippet}
                  className="p-1.5 text-[#858585] hover:text-[#f14c4c] transition-colors"
                  title="Delete Snippet"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className={`transition-all duration-300 ${editorMinimized ? 'h-12' : 'flex-1'} bg-[#1e1e1e] flex flex-col relative`}>
              <div className="absolute right-4 top-2 z-10 flex space-x-2">
                <button 
                  onClick={() => setEditorMinimized(!editorMinimized)}
                  className="p-1 hover:bg-[#333333] rounded text-[#858585]"
                >
                  {editorMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
              </div>
              
              <textarea
                className={`w-full h-full p-6 bg-[#1e1e1e] text-[#d4d4d4] code-font text-sm resize-none focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#007acc]/30 ${editorMinimized ? 'hidden' : 'block'}`}
                spellCheck={false}
                value={sqlCode}
                onChange={(e) => setSqlCode(e.target.value)}
              />
              
              {editorMinimized && (
                <div className="flex items-center px-6 h-full text-xs text-[#858585] italic truncate">
                  {sqlCode.substring(0, 100)}...
                </div>
              )}

              {showSafetyApproval && (
                <div className="absolute inset-0 z-50 bg-[#1e1e1e]/95 flex flex-col items-center justify-center p-8 backdrop-blur-md">
                  <div className="max-w-md w-full bg-[#252526] border border-amber-500/50 rounded-lg shadow-2xl p-8 transform transition-all duration-300 scale-100">
                    <div className="flex items-center space-x-3 text-amber-500 mb-6">
                      <div className="p-3 bg-amber-500/10 rounded-full">
                        <AlertTriangle size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Destructive Action Review</h3>
                        <p className="text-[10px] text-[#858585] uppercase tracking-widest font-bold">Safety Guardrails Active</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      <p className="text-sm text-[#cccccc] leading-relaxed">
                        The AI engine has identified potential risks with this <span className="text-amber-500 font-bold uppercase">{sqlCode.trim().split(' ')[0]}</span> operation. Please review the findings before confirming:
                      </p>
                      <div className="bg-[#1a1a1b] border border-[#333333] rounded-md overflow-hidden">
                        <div className="px-3 py-2 bg-[#2a2d2e] border-b border-[#333333] text-[10px] font-bold text-[#858585] flex items-center">
                          <ShieldAlert size={12} className="mr-1.5" /> CRITICAL FINDINGS
                        </div>
                        <div className="p-4 space-y-3">
                          {safetyInfo?.warnings.map((w, i) => (
                            <div key={i} className="flex items-start space-x-3 text-xs text-[#d4d4d4]">
                               <ChevronRight size={14} className="mt-0.5 text-amber-500 flex-shrink-0" />
                               <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                      <button 
                        onClick={() => runQuery(true)}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-3 rounded flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-[0.98]"
                      >
                        <ShieldCheck size={18} />
                        <span>I Understand, Run Modification</span>
                      </button>
                      <button 
                        onClick={() => setShowSafetyApproval(false)}
                        className="w-full bg-[#3a3d41] hover:bg-[#45494e] text-white text-sm font-bold py-2.5 rounded transition-colors"
                      >
                        Abort Operation
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(lintInfo || safetyInfo) && (
              <div className="bg-[#252526] border-t border-[#1e1e1e] max-h-48 overflow-y-auto">
                <div className="flex px-4 py-2 border-b border-[#333333] bg-[#2d2d2d] sticky top-0 z-10 items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#bbbbbb] tracking-widest flex items-center">
                    <Activity size={12} className="mr-2" /> AI Intelligence Panel
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {safetyInfo && !safetyInfo.isSafe && (
                    <div className="flex items-start">
                      <ShieldAlert size={14} className="text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-[11px]">
                        <p className="font-bold text-amber-500 mb-1">Safety Risk</p>
                        {safetyInfo.warnings.map((w, i) => (
                          <p key={i} className="text-[#cccccc]">{w}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {lintInfo && lintInfo.errors.length > 0 && (
                    <div className="flex items-start">
                      <AlertCircle size={14} className="text-[#f14c4c] mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-[11px]">
                        <p className="font-bold text-[#f14c4c] mb-1">Syntax Issues</p>
                        {lintInfo.errors.map((e, i) => (
                          <p key={i} className="text-[#cccccc]">{e}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {lintInfo && lintInfo.suggestions.length > 0 && (
                    <div className="flex items-start">
                      <CheckCircle2 size={14} className="text-[#4ec9b0] mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-[11px]">
                        <p className="font-bold text-[#4ec9b0] mb-1">Styling Tips</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {lintInfo.suggestions.map((s, i) => (
                            <span key={i} className="bg-[#1e1e1e] border border-[#333333] px-2 py-0.5 rounded text-[#858585]">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {safetyInfo && safetyInfo.isSafe && (
                    <div className="flex items-start">
                      <Lightbulb size={14} className="text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-[11px]">
                        <p className="font-bold text-blue-400 mb-1">Optimization Suggestion</p>
                        <p className="text-[#cccccc] italic">{safetyInfo.suggestions}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="h-64 bg-[#1e1e1e] border-t border-[#1e1e1e]">
              <ResultPanel result={queryResult} isLoading={isExecuting} />
            </div>
          </>
        )}
      </main>

      <DbtExportModal 
        isOpen={showDbtModal} 
        onClose={() => setShowDbtModal(false)} 
        data={dbtExportData}
        modelName={snippetName || "Untitled Model"}
      />

      <div className="fixed bottom-0 left-0 right-0 h-6 bg-[#007acc] flex items-center px-3 justify-between text-[11px] text-white z-50">
        <div className="flex items-center space-x-4">
          <span className="flex items-center hover:bg-white/10 px-1 cursor-pointer">
            <Activity size={12} className="mr-1" /> Master Branch
          </span>
          <span className="flex items-center hover:bg-white/10 px-1 cursor-pointer">
            {appConfig.dialect} Connected
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="opacity-80">UTF-8</span>
          <span className="opacity-80">SQL (AI: {appConfig.geminiModel})</span>
        </div>
      </div>
    </div>
  );
};

export default App;
