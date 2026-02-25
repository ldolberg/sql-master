import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SnippetExplorer from './components/SnippetExplorer';
import ResultPanel from './components/ResultPanel';
import SettingsPanel from './components/SettingsPanel';
import DbtExportModal from './components/DbtExportModal';
import TestDashboard from './components/TestDashboard';
import ChatPanel from './components/ChatPanel';
import { executeSql } from './services/sqlRunner';
import { autoTagSnippet, checkSqlSafety, semanticSearch, generateDbtModel, lintAndFormatSql, initializeChat } from './services/geminiService';
import { Play, Save, Trash2, ShieldAlert, Lightbulb, Search, Activity, Maximize2, Minimize2, Box, Wand2, AlertCircle, CheckCircle2, History, Terminal, Clock, ExternalLink, RotateCw, Beaker, ShieldCheck, AlertTriangle, ChevronRight, MessageSquareText } from 'lucide-react';
const App = () => {
    const [snippets, setSnippets] = useState([]);
    const [history, setHistory] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [activeTab, setActiveTab] = useState('files');
    const [sqlCode, setSqlCode] = useState('');
    const [snippetName, setSnippetName] = useState('');
    const [queryResult, setQueryResult] = useState(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLinting, setIsLinting] = useState(false);
    const [safetyInfo, setSafetyInfo] = useState(null);
    const [lintInfo, setLintInfo] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [editorMinimized, setEditorMinimized] = useState(false);
    // Safety Approval State
    const [showSafetyApproval, setShowSafetyApproval] = useState(false);
    const [isAnalyzingSafety, setIsAnalyzingSafety] = useState(false);
    // dbt Export State
    const [isExportingDbt, setIsExportingDbt] = useState(false);
    const [dbtExportData, setDbtExportData] = useState(null);
    const [showDbtModal, setShowDbtModal] = useState(false);
    // Configuration state
    const [appConfig, setAppConfig] = useState({
        openaiKey: '',
        anthropicKey: '',
        geminiModel: 'gemini-3-flash-preview',
        dialect: 'PostgreSQL'
    });
    // Initialize with dummy data
    useEffect(() => {
        const initial = [
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
    const handleSelectSnippet = (id) => {
        const snip = snippets.find(s => s.id === id);
        if (snip) {
            setActiveId(id);
            setSqlCode(snip.code);
            setSnippetName(snip.name);
            setSafetyInfo(null);
            setLintInfo(null);
            setShowSafetyApproval(false);
            if (['settings', 'tests', 'chat'].includes(activeTab))
                setActiveTab('files');
        }
    };
    const handleNewSnippet = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newSnip = {
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
        if (!activeId)
            return;
        setSnippets(snippets.filter(s => s.id !== activeId));
        setActiveId(null);
        setSqlCode('');
        setSnippetName('');
        setLintInfo(null);
        setShowSafetyApproval(false);
    };
    const handleLintAndFormat = async () => {
        if (!sqlCode.trim())
            return;
        setIsLinting(true);
        try {
            const result = await lintAndFormatSql(sqlCode, appConfig.dialect);
            setLintInfo(result);
            if (result.formattedCode) {
                setSqlCode(result.formattedCode);
            }
        }
        finally {
            setIsLinting(false);
        }
    };
    const isModificationQuery = (sql) => {
        const trimmed = sql.trim().toUpperCase();
        return trimmed.startsWith('UPDATE') || trimmed.startsWith('DELETE') || trimmed.startsWith('INSERT') || trimmed.startsWith('DROP') || trimmed.startsWith('TRUNCATE');
    };
    const runQuery = async (skipSafetyCheck = false) => {
        const code = sqlCode.trim();
        if (!code)
            return;
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
            }
            catch (err) {
                console.error("Safety check failed, proceeding with caution", err);
            }
            finally {
                setIsAnalyzingSafety(false);
            }
        }
        setIsExecuting(true);
        setShowSafetyApproval(false);
        try {
            const result = await executeSql(code, appConfig.dialect);
            setQueryResult(result);
            const historyEntry = {
                id: Math.random().toString(36).substr(2, 9),
                snippetId: activeId,
                name: snippetName || 'Ad-hoc Query',
                code: code,
                timestamp: Date.now(),
                executionTime: result.executionTime
            };
            setHistory(prev => [historyEntry, ...prev]);
            if (activeId) {
                setSnippets(prev => prev.map(s => s.id === activeId
                    ? { ...s, usageCount: s.usageCount + 1, lastRunAt: Date.now(), code: code }
                    : s));
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setIsExecuting(false);
        }
    };
    const saveSnippet = async () => {
        if (!activeId)
            return;
        setIsSaving(true);
        try {
            const { tags, category } = await autoTagSnippet(sqlCode, appConfig.dialect);
            setSnippets(prev => prev.map(s => s.id === activeId
                ? { ...s, name: snippetName, code: sqlCode, tags, category }
                : s));
        }
        finally {
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
        }
        finally {
            setIsExportingDbt(false);
        }
    };
    const performSearch = async () => {
        if (!searchQuery.trim())
            return;
        setIsSearching(true);
        try {
            const matchedIds = await semanticSearch(searchQuery, snippets);
            const results = matchedIds
                .map(id => snippets.find(s => s.id === id))
                .filter((s) => !!s);
            setSearchResults(results);
        }
        finally {
            setIsSearching(false);
        }
    };
    const loadFromHistory = (entry) => {
        setSqlCode(entry.code);
        setSnippetName(entry.name);
        if (entry.snippetId) {
            setActiveId(entry.snippetId);
        }
        else {
            setActiveId(null);
        }
        setQueryResult(null);
        setSafetyInfo(null);
        setLintInfo(null);
        setShowSafetyApproval(false);
    };
    const rerunFromHistory = (entry) => {
        loadFromHistory(entry);
        setTimeout(() => {
            runQuery();
        }, 0);
    };
    return (_jsxs("div", { className: "flex h-screen bg-[#1e1e1e] text-[#d4d4d4] overflow-hidden", children: [_jsx(Sidebar, { activeTab: activeTab, setActiveTab: setActiveTab, onNewSnippet: handleNewSnippet }), _jsxs("div", { className: "w-64 md:w-80 bg-[#252526] border-r border-[#1e1e1e] flex flex-col", children: [activeTab === 'files' && (_jsx(SnippetExplorer, { snippets: snippets, selectedId: activeId, onSelect: handleSelectSnippet })), activeTab === 'search' && (_jsxs("div", { className: "flex-1 p-4 flex flex-col space-y-4", children: [_jsxs("h2", { className: "text-xs font-bold uppercase text-[#bbbbbb] tracking-wider flex items-center", children: [_jsx(Search, { size: 14, className: "mr-2" }), " Semantic Search"] }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", placeholder: "e.g. Find inconsistent client ids", className: "w-full bg-[#3c3c3c] text-xs py-2 px-3 rounded border border-transparent focus:border-[#007acc] outline-none", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), onKeyDown: (e) => e.key === 'Enter' && performSearch() }), _jsx("button", { onClick: performSearch, className: "absolute right-2 top-1.5 text-[#858585] hover:text-white", children: isSearching ? _jsx("div", { className: "w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" }) : _jsx(Search, { size: 16 }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto space-y-2", children: [searchResults.map(s => (_jsxs("button", { onClick: () => handleSelectSnippet(s.id), className: "w-full text-left p-2 rounded bg-[#2a2d2e] hover:bg-[#37373d] transition-colors border-l-2 border-blue-500", children: [_jsx("p", { className: "text-xs font-semibold text-[#cccccc]", children: s.name }), _jsx("code", { className: "text-[10px] text-[#858585] block mt-1 truncate", children: s.code })] }, s.id))), !isSearching && searchQuery && searchResults.length === 0 && (_jsx("p", { className: "text-[10px] text-center text-[#858585] pt-4 italic", children: "No semantic matches found." }))] })] })), activeTab === 'chat' && _jsx(ChatPanel, { currentSql: sqlCode, dialect: appConfig.dialect }), activeTab === 'history' && (_jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-[#333333] bg-[#2d2d2d]", children: _jsxs("h2", { className: "text-xs font-bold uppercase text-[#bbbbbb] tracking-wider flex items-center", children: [_jsx(History, { size: 14, className: "mr-2" }), " Execution History"] }) }), _jsx("div", { className: "flex-1 overflow-y-auto", children: history.length === 0 ? (_jsxs("div", { className: "p-8 text-center text-[#858585] flex flex-col items-center", children: [_jsx(Clock, { size: 32, className: "opacity-20 mb-2" }), _jsx("p", { className: "text-[10px]", children: "No execution history yet." })] })) : (_jsx("div", { className: "divide-y divide-[#333333]", children: history.map((entry) => (_jsxs("div", { className: "p-3 hover:bg-[#2a2d2e] group transition-colors", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-[11px] font-semibold text-[#cccccc] truncate pr-2", children: entry.name }), _jsx("span", { className: "text-[9px] text-[#858585] whitespace-nowrap", children: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] }), _jsx("div", { className: "flex items-center space-x-3 text-[9px] text-[#858585] mb-2", children: _jsxs("span", { className: "flex items-center", children: [_jsx(Terminal, { size: 10, className: "mr-1" }), " ", entry.executionTime, "ms"] }) }), _jsx("code", { className: "block text-[10px] text-[#6a9955] font-mono truncate mb-2 opacity-80 italic", children: entry.code.replace(/\s+/g, ' ') }), _jsxs("div", { className: "flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsxs("button", { onClick: () => loadFromHistory(entry), className: "flex items-center space-x-1 px-2 py-0.5 bg-[#3c3c3c] hover:bg-[#45494e] text-white rounded text-[9px]", children: [_jsx(ExternalLink, { size: 10 }), _jsx("span", { children: "Load" })] }), _jsxs("button", { onClick: () => rerunFromHistory(entry), className: "flex items-center space-x-1 px-2 py-0.5 bg-[#007acc] hover:bg-[#118ad4] text-white rounded text-[9px]", children: [_jsx(RotateCw, { size: 10 }), _jsx("span", { children: "Re-run" })] })] })] }, entry.id))) })) })] })), activeTab === 'tests' && _jsx(TestDashboard, {}), activeTab === 'settings' && (_jsxs("div", { className: "flex-1 p-4 border-b border-[#333333]", children: [_jsx("h2", { className: "text-xs font-bold uppercase text-[#bbbbbb] tracking-wider flex items-center", children: "Configuration Active" }), _jsx("p", { className: "text-[10px] text-[#858585] mt-2 italic", children: "Editing global application settings." })] }))] }), _jsx("main", { className: "flex-1 flex flex-col min-w-0", children: activeTab === 'settings' ? (_jsx(SettingsPanel, { config: appConfig, onUpdate: (updates) => setAppConfig(prev => ({ ...prev, ...updates })) })) : activeTab === 'tests' ? (_jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-12 text-center", children: [_jsx(Beaker, { size: 64, className: "text-[#007acc] mb-6 opacity-20" }), _jsx("h1", { className: "text-xl font-bold text-[#cccccc] mb-2", children: "Test Suite Explorer" }), _jsx("p", { className: "max-w-md text-sm text-[#858585]", children: "This environment allows you to run unit and integration tests for AI-powered features. Select a test in the explorer to see detailed assertions." })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "h-12 bg-[#2d2d2d] flex items-center px-4 justify-between border-b border-[#1e1e1e]", children: [_jsx("div", { className: "flex items-center space-x-3 overflow-hidden", children: _jsx("input", { value: snippetName, onChange: (e) => setSnippetName(e.target.value), className: "bg-transparent text-sm font-semibold text-[#cccccc] focus:outline-none focus:ring-1 focus:ring-[#007acc] px-2 py-1 rounded w-64", placeholder: "Snippet Name..." }) }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("button", { onClick: () => setActiveTab('chat'), className: "flex items-center space-x-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 text-xs font-medium transition-colors", title: "Discuss this snippet with AI", children: [_jsx(MessageSquareText, { size: 14 }), _jsx("span", { className: "hidden lg:inline", children: "Ask AI" })] }), _jsxs("button", { onClick: handleLintAndFormat, disabled: !sqlCode || isLinting, className: "flex items-center space-x-1.5 px-3 py-1.5 bg-[#4ec9b0]/10 hover:bg-[#4ec9b0]/20 border border-[#4ec9b0]/30 rounded text-[#4ec9b0] text-xs font-medium transition-colors disabled:opacity-50", title: "Clean, Lint & Format with AI", children: [_jsx(Wand2, { size: 14, className: isLinting ? "animate-pulse" : "" }), _jsx("span", { className: "hidden md:inline", children: isLinting ? 'Cleaning...' : 'Clean' })] }), _jsxs("button", { onClick: exportAsDbt, disabled: !sqlCode || isExecuting, className: "flex items-center space-x-1.5 px-3 py-1.5 bg-[#ff694b]/10 hover:bg-[#ff694b]/20 border border-[#ff694b]/30 rounded text-[#ff694b] text-xs font-medium transition-colors disabled:opacity-50", title: "Export to dbt", children: [_jsx(Box, { size: 14 }), _jsx("span", { className: "hidden md:inline", children: "dbt" })] }), _jsxs("button", { onClick: () => runQuery(), disabled: isExecuting || isAnalyzingSafety, className: "flex items-center space-x-1.5 px-3 py-1.5 bg-[#007acc] hover:bg-[#118ad4] rounded text-white text-xs font-medium transition-colors disabled:opacity-50", children: [_jsx(Play, { size: 14, fill: "currentColor" }), _jsx("span", { children: isExecuting ? 'Running...' : isAnalyzingSafety ? 'Checking Safety...' : 'Execute' })] }), _jsxs("button", { onClick: saveSnippet, disabled: isSaving, className: "flex items-center space-x-1.5 px-3 py-1.5 bg-[#3a3d41] hover:bg-[#45494e] rounded text-white text-xs font-medium transition-colors", children: [_jsx(Save, { size: 14 }), _jsx("span", { children: isSaving ? 'Saving...' : 'Save & Tag' })] }), _jsx("button", { onClick: handleDeleteSnippet, className: "p-1.5 text-[#858585] hover:text-[#f14c4c] transition-colors", title: "Delete Snippet", children: _jsx(Trash2, { size: 16 }) })] })] }), _jsxs("div", { className: `transition-all duration-300 ${editorMinimized ? 'h-12' : 'flex-1'} bg-[#1e1e1e] flex flex-col relative`, children: [_jsx("div", { className: "absolute right-4 top-2 z-10 flex space-x-2", children: _jsx("button", { onClick: () => setEditorMinimized(!editorMinimized), className: "p-1 hover:bg-[#333333] rounded text-[#858585]", children: editorMinimized ? _jsx(Maximize2, { size: 14 }) : _jsx(Minimize2, { size: 14 }) }) }), _jsx("textarea", { className: `w-full h-full p-6 bg-[#1e1e1e] text-[#d4d4d4] code-font text-sm resize-none focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#007acc]/30 ${editorMinimized ? 'hidden' : 'block'}`, spellCheck: false, value: sqlCode, onChange: (e) => setSqlCode(e.target.value) }), editorMinimized && (_jsxs("div", { className: "flex items-center px-6 h-full text-xs text-[#858585] italic truncate", children: [sqlCode.substring(0, 100), "..."] })), showSafetyApproval && (_jsx("div", { className: "absolute inset-0 z-50 bg-[#1e1e1e]/95 flex flex-col items-center justify-center p-8 backdrop-blur-md", children: _jsxs("div", { className: "max-w-md w-full bg-[#252526] border border-amber-500/50 rounded-lg shadow-2xl p-8 transform transition-all duration-300 scale-100", children: [_jsxs("div", { className: "flex items-center space-x-3 text-amber-500 mb-6", children: [_jsx("div", { className: "p-3 bg-amber-500/10 rounded-full", children: _jsx(AlertTriangle, { size: 32 }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold", children: "Destructive Action Review" }), _jsx("p", { className: "text-[10px] text-[#858585] uppercase tracking-widest font-bold", children: "Safety Guardrails Active" })] })] }), _jsxs("div", { className: "space-y-4 mb-8", children: [_jsxs("p", { className: "text-sm text-[#cccccc] leading-relaxed", children: ["The AI engine has identified potential risks with this ", _jsx("span", { className: "text-amber-500 font-bold uppercase", children: sqlCode.trim().split(' ')[0] }), " operation. Please review the findings before confirming:"] }), _jsxs("div", { className: "bg-[#1a1a1b] border border-[#333333] rounded-md overflow-hidden", children: [_jsxs("div", { className: "px-3 py-2 bg-[#2a2d2e] border-b border-[#333333] text-[10px] font-bold text-[#858585] flex items-center", children: [_jsx(ShieldAlert, { size: 12, className: "mr-1.5" }), " CRITICAL FINDINGS"] }), _jsx("div", { className: "p-4 space-y-3", children: safetyInfo?.warnings.map((w, i) => (_jsxs("div", { className: "flex items-start space-x-3 text-xs text-[#d4d4d4]", children: [_jsx(ChevronRight, { size: 14, className: "mt-0.5 text-amber-500 flex-shrink-0" }), _jsx("span", { children: w })] }, i))) })] })] }), _jsxs("div", { className: "flex flex-col space-y-3", children: [_jsxs("button", { onClick: () => runQuery(true), className: "w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-3 rounded flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-[0.98]", children: [_jsx(ShieldCheck, { size: 18 }), _jsx("span", { children: "I Understand, Run Modification" })] }), _jsx("button", { onClick: () => setShowSafetyApproval(false), className: "w-full bg-[#3a3d41] hover:bg-[#45494e] text-white text-sm font-bold py-2.5 rounded transition-colors", children: "Abort Operation" })] })] }) }))] }), (lintInfo || safetyInfo) && (_jsxs("div", { className: "bg-[#252526] border-t border-[#1e1e1e] max-h-48 overflow-y-auto", children: [_jsx("div", { className: "flex px-4 py-2 border-b border-[#333333] bg-[#2d2d2d] sticky top-0 z-10 items-center justify-between", children: _jsxs("span", { className: "text-[10px] font-bold uppercase text-[#bbbbbb] tracking-widest flex items-center", children: [_jsx(Activity, { size: 12, className: "mr-2" }), " AI Intelligence Panel"] }) }), _jsxs("div", { className: "p-4 space-y-4", children: [safetyInfo && !safetyInfo.isSafe && (_jsxs("div", { className: "flex items-start", children: [_jsx(ShieldAlert, { size: 14, className: "text-amber-500 mt-0.5 mr-3 flex-shrink-0" }), _jsxs("div", { className: "text-[11px]", children: [_jsx("p", { className: "font-bold text-amber-500 mb-1", children: "Safety Risk" }), safetyInfo.warnings.map((w, i) => (_jsx("p", { className: "text-[#cccccc]", children: w }, i)))] })] })), lintInfo && lintInfo.errors.length > 0 && (_jsxs("div", { className: "flex items-start", children: [_jsx(AlertCircle, { size: 14, className: "text-[#f14c4c] mt-0.5 mr-3 flex-shrink-0" }), _jsxs("div", { className: "text-[11px]", children: [_jsx("p", { className: "font-bold text-[#f14c4c] mb-1", children: "Syntax Issues" }), lintInfo.errors.map((e, i) => (_jsx("p", { className: "text-[#cccccc]", children: e }, i)))] })] })), lintInfo && lintInfo.suggestions.length > 0 && (_jsxs("div", { className: "flex items-start", children: [_jsx(CheckCircle2, { size: 14, className: "text-[#4ec9b0] mt-0.5 mr-3 flex-shrink-0" }), _jsxs("div", { className: "text-[11px]", children: [_jsx("p", { className: "font-bold text-[#4ec9b0] mb-1", children: "Styling Tips" }), _jsx("div", { className: "flex flex-wrap gap-2 mt-1", children: lintInfo.suggestions.map((s, i) => (_jsx("span", { className: "bg-[#1e1e1e] border border-[#333333] px-2 py-0.5 rounded text-[#858585]", children: s }, i))) })] })] })), safetyInfo && safetyInfo.isSafe && (_jsxs("div", { className: "flex items-start", children: [_jsx(Lightbulb, { size: 14, className: "text-blue-400 mt-0.5 mr-3 flex-shrink-0" }), _jsxs("div", { className: "text-[11px]", children: [_jsx("p", { className: "font-bold text-blue-400 mb-1", children: "Optimization Suggestion" }), _jsx("p", { className: "text-[#cccccc] italic", children: safetyInfo.suggestions })] })] }))] })] })), _jsx("div", { className: "h-64 bg-[#1e1e1e] border-t border-[#1e1e1e]", children: _jsx(ResultPanel, { result: queryResult, isLoading: isExecuting }) })] })) }), _jsx(DbtExportModal, { isOpen: showDbtModal, onClose: () => setShowDbtModal(false), data: dbtExportData, modelName: snippetName || "Untitled Model" }), _jsxs("div", { className: "fixed bottom-0 left-0 right-0 h-6 bg-[#007acc] flex items-center px-3 justify-between text-[11px] text-white z-50", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("span", { className: "flex items-center hover:bg-white/10 px-1 cursor-pointer", children: [_jsx(Activity, { size: 12, className: "mr-1" }), " Master Branch"] }), _jsxs("span", { className: "flex items-center hover:bg-white/10 px-1 cursor-pointer", children: [appConfig.dialect, " Connected"] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("span", { className: "opacity-80", children: "UTF-8" }), _jsxs("span", { className: "opacity-80", children: ["SQL (AI: ", appConfig.geminiModel, ")"] })] })] })] }));
};
export default App;
