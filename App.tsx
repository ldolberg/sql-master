
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SQLSnippet, QueryResult, SafetyCheck } from './types';
import Sidebar from './components/Sidebar';
import SnippetExplorer from './components/SnippetExplorer';
import ResultPanel from './components/ResultPanel';
import { executeSql } from './services/sqlRunner';
import { autoTagSnippet, checkSqlSafety, semanticSearch } from './services/geminiService';
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
  Minimize2
} from 'lucide-react';

const App: React.FC = () => {
  const [snippets, setSnippets] = useState<SQLSnippet[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'search' | 'history'>('files');
  const [sqlCode, setSqlCode] = useState('');
  const [snippetName, setSnippetName] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [safetyInfo, setSafetyInfo] = useState<SafetyCheck | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SQLSnippet[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editorMinimized, setEditorMinimized] = useState(false);

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
  }, []);

  const handleSelectSnippet = (id: string) => {
    const snip = snippets.find(s => s.id === id);
    if (snip) {
      setActiveId(id);
      setSqlCode(snip.code);
      setSnippetName(snip.name);
      setSafetyInfo(null);
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
  };

  const handleDeleteSnippet = () => {
    if (!activeId) return;
    setSnippets(snippets.filter(s => s.id !== activeId));
    setActiveId(null);
    setSqlCode('');
    setSnippetName('');
  };

  const runQuery = async () => {
    setIsExecuting(true);
    try {
      // Logic for safety check on run
      const safety = await checkSqlSafety(sqlCode);
      setSafetyInfo(safety);

      if (!safety.isSafe && safety.warnings.length > 0) {
        // We warn but proceed in this demo environment
      }

      const result = await executeSql(sqlCode);
      setQueryResult(result);

      // Update usage tracking
      if (activeId) {
        setSnippets(prev => prev.map(s => 
          s.id === activeId 
            ? { ...s, usageCount: s.usageCount + 1, lastRunAt: Date.now(), code: sqlCode } 
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
      const { tags, category } = await autoTagSnippet(sqlCode);
      setSnippets(prev => prev.map(s => 
        s.id === activeId 
          ? { ...s, name: snippetName, code: sqlCode, tags, category } 
          : s
      ));
    } finally {
      setIsSaving(false);
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

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-[#d4d4d4] overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onNewSnippet={handleNewSnippet} />

      {/* Side Panel (Explorer / Search) */}
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

        {activeTab === 'history' && (
          <div className="flex-1 p-4">
            <h2 className="text-xs font-bold uppercase text-[#bbbbbb] tracking-wider mb-4 flex items-center">
              <Activity size={14} className="mr-2" /> Recent Activity
            </h2>
            <div className="space-y-4">
              {snippets.sort((a,b) => b.lastRunAt - a.lastRunAt).slice(0, 5).map(s => (
                <div key={s.id} className="text-[11px] border-b border-[#333333] pb-2">
                  <p className="text-[#cccccc] font-medium">{s.name}</p>
                  <div className="flex justify-between text-[9px] text-[#858585] mt-1">
                    <span>Used {s.usageCount} times</span>
                    <span>{s.lastRunAt ? new Date(s.lastRunAt).toLocaleTimeString() : 'Never'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Editor Toolbar */}
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
              onClick={runQuery}
              disabled={isExecuting}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#007acc] hover:bg-[#118ad4] rounded text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Play size={14} fill="currentColor" />
              <span>{isExecuting ? 'Running...' : 'Execute'}</span>
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

        {/* SQL Editor Area */}
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
        </div>

        {/* Safety & Intelligence Suggestions */}
        {safetyInfo && (
          <div className={`p-4 ${safetyInfo.isSafe ? 'bg-blue-900/10 border-blue-900/30' : 'bg-amber-900/10 border-amber-900/30'} border-t border-b`}>
            <div className="flex items-start">
              {safetyInfo.isSafe ? (
                <Lightbulb size={18} className="text-blue-400 mt-1 mr-3 flex-shrink-0" />
              ) : (
                <ShieldAlert size={18} className="text-amber-400 mt-1 mr-3 flex-shrink-0" />
              )}
              <div className="text-xs">
                <p className="font-bold text-[#bbbbbb] mb-1">AI Safety Analysis</p>
                {safetyInfo.warnings.map((w, i) => (
                  <p key={i} className="text-amber-400/90 mb-1 flex items-center">
                    <Hash size={10} className="mr-1" /> {w}
                  </p>
                ))}
                <p className="text-[#858585] italic">{safetyInfo.suggestions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Result Area */}
        <div className="h-64 bg-[#1e1e1e] border-t border-[#1e1e1e]">
          <ResultPanel result={queryResult} isLoading={isExecuting} />
        </div>
      </main>

      {/* App Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-6 bg-[#007acc] flex items-center px-3 justify-between text-[11px] text-white z-50">
        <div className="flex items-center space-x-4">
          <span className="flex items-center hover:bg-white/10 px-1 cursor-pointer">
            <Activity size={12} className="mr-1" /> Master Branch
          </span>
          <span className="flex items-center hover:bg-white/10 px-1 cursor-pointer">
            PostgreSQL Connected
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="opacity-80">UTF-8</span>
          <span className="opacity-80">SQL (AI Guided)</span>
        </div>
      </div>
    </div>
  );
};

export default App;
