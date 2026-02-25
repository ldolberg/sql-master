import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Beaker, Play, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { TEST_SUITE, runTestCase } from '../services/testRunner';
const TestDashboard = () => {
    const [tests, setTests] = useState(TEST_SUITE.map(t => ({ ...t, status: 'pending' })));
    const [isRunning, setIsRunning] = useState(false);
    const runAllTests = async () => {
        setIsRunning(true);
        const updatedTests = [...tests];
        for (let i = 0; i < updatedTests.length; i++) {
            const t = updatedTests[i];
            updatedTests[i] = { ...t, status: 'running' };
            setTests([...updatedTests]);
            const result = await runTestCase(t);
            updatedTests[i] = {
                ...updatedTests[i],
                status: result.passed ? 'passed' : 'failed',
                error: result.error,
                duration: result.duration
            };
            setTests([...updatedTests]);
        }
        setIsRunning(false);
    };
    const stats = {
        total: tests.length,
        passed: tests.filter(t => t.status === 'passed').length,
        failed: tests.filter(t => t.status === 'failed').length,
        pending: tests.filter(t => t.status === 'pending').length,
    };
    return (_jsxs("div", { className: "flex-1 flex flex-col h-full bg-[#252526] overflow-hidden", children: [_jsxs("div", { className: "p-4 border-b border-[#333333] flex items-center justify-between bg-[#2d2d2d]", children: [_jsxs("h2", { className: "text-xs font-bold uppercase text-[#bbbbbb] tracking-wider flex items-center", children: [_jsx(Beaker, { size: 14, className: "mr-2" }), " AI Feature Testing"] }), _jsxs("button", { onClick: runAllTests, disabled: isRunning, className: "flex items-center space-x-1.5 px-3 py-1 bg-[#007acc] hover:bg-[#118ad4] disabled:opacity-50 text-white rounded text-[10px] font-bold transition-all", children: [isRunning ? _jsx(Loader2, { size: 12, className: "animate-spin" }) : _jsx(Play, { size: 12, fill: "currentColor" }), _jsx("span", { children: isRunning ? 'Testing...' : 'Run All' })] })] }), _jsxs("div", { className: "flex divide-x divide-[#333333] border-b border-[#333333] bg-[#1e1e1e]", children: [_jsxs("div", { className: "flex-1 p-2 text-center", children: [_jsx("p", { className: "text-[10px] text-[#858585] uppercase", children: "Passed" }), _jsx("p", { className: "text-sm font-bold text-green-500", children: stats.passed })] }), _jsxs("div", { className: "flex-1 p-2 text-center", children: [_jsx("p", { className: "text-[10px] text-[#858585] uppercase", children: "Failed" }), _jsx("p", { className: "text-sm font-bold text-red-500", children: stats.failed })] }), _jsxs("div", { className: "flex-1 p-2 text-center", children: [_jsx("p", { className: "text-[10px] text-[#858585] uppercase", children: "Pending" }), _jsx("p", { className: "text-sm font-bold text-[#858585]", children: stats.pending })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-2 space-y-1", children: tests.map(test => (_jsx("div", { className: `p-2 rounded border border-transparent transition-all ${test.status === 'running' ? 'bg-[#37373d] border-[#007acc]/30' :
                        test.status === 'passed' ? 'hover:bg-green-500/5' :
                            test.status === 'failed' ? 'bg-red-500/5 border-red-500/20' : 'hover:bg-[#2a2d2e]'}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start space-x-3", children: [_jsxs("div", { className: "mt-0.5", children: [test.status === 'passed' && _jsx(CheckCircle2, { size: 14, className: "text-green-500" }), test.status === 'failed' && _jsx(XCircle, { size: 14, className: "text-red-500" }), test.status === 'running' && _jsx(Loader2, { size: 14, className: "text-blue-400 animate-spin" }), test.status === 'pending' && _jsx("div", { className: "w-3.5 h-3.5 rounded-full border border-[#858585] border-dashed" })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-[11px] font-bold text-[#cccccc]", children: test.name }), _jsx("span", { className: "text-[9px] bg-[#3c3c3c] text-[#858585] px-1 rounded", children: test.category })] }), _jsx("p", { className: "text-[10px] text-[#858585] mt-0.5 leading-tight", children: test.description }), test.error && (_jsxs("div", { className: "mt-2 p-2 bg-red-900/10 border border-red-500/20 rounded text-red-400 text-[9px] font-mono whitespace-pre-wrap", children: [_jsx(AlertTriangle, { size: 10, className: "inline mr-1" }), " ", test.error] }))] })] }), test.duration && (_jsxs("span", { className: "text-[9px] text-[#666666] font-mono", children: [Math.round(test.duration), "ms"] }))] }) }, test.id))) }), _jsx("div", { className: "p-3 bg-[#2d2d2d] border-t border-[#333333]", children: _jsx("p", { className: "text-[10px] text-[#858585] italic", children: "Integration tests exercise Gemini AI models directly to ensure prompt accuracy and safety logic." }) })] }));
};
export default TestDashboard;
