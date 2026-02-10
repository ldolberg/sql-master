
import React, { useState } from 'react';
import { Beaker, Play, CheckCircle2, XCircle, Loader2, AlertTriangle, ListFilter } from 'lucide-react';
import { TestCase } from '../types';
import { TEST_SUITE, runTestCase } from '../services/testRunner';

const TestDashboard: React.FC = () => {
  const [tests, setTests] = useState<TestCase[]>(TEST_SUITE.map(t => ({ ...t, status: 'pending' })));
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#252526] overflow-hidden">
      <div className="p-4 border-b border-[#333333] flex items-center justify-between bg-[#2d2d2d]">
        <h2 className="text-xs font-bold uppercase text-[#bbbbbb] tracking-wider flex items-center">
          <Beaker size={14} className="mr-2" /> AI Feature Testing
        </h2>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="flex items-center space-x-1.5 px-3 py-1 bg-[#007acc] hover:bg-[#118ad4] disabled:opacity-50 text-white rounded text-[10px] font-bold transition-all"
        >
          {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
          <span>{isRunning ? 'Testing...' : 'Run All'}</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex divide-x divide-[#333333] border-b border-[#333333] bg-[#1e1e1e]">
        <div className="flex-1 p-2 text-center">
          <p className="text-[10px] text-[#858585] uppercase">Passed</p>
          <p className="text-sm font-bold text-green-500">{stats.passed}</p>
        </div>
        <div className="flex-1 p-2 text-center">
          <p className="text-[10px] text-[#858585] uppercase">Failed</p>
          <p className="text-sm font-bold text-red-500">{stats.failed}</p>
        </div>
        <div className="flex-1 p-2 text-center">
          <p className="text-[10px] text-[#858585] uppercase">Pending</p>
          <p className="text-sm font-bold text-[#858585]">{stats.pending}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {tests.map(test => (
          <div 
            key={test.id} 
            className={`p-2 rounded border border-transparent transition-all ${
              test.status === 'running' ? 'bg-[#37373d] border-[#007acc]/30' : 
              test.status === 'passed' ? 'hover:bg-green-500/5' : 
              test.status === 'failed' ? 'bg-red-500/5 border-red-500/20' : 'hover:bg-[#2a2d2e]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  {test.status === 'passed' && <CheckCircle2 size={14} className="text-green-500" />}
                  {test.status === 'failed' && <XCircle size={14} className="text-red-500" />}
                  {test.status === 'running' && <Loader2 size={14} className="text-blue-400 animate-spin" />}
                  {test.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-[#858585] border-dashed" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-[#cccccc]">{test.name}</span>
                    <span className="text-[9px] bg-[#3c3c3c] text-[#858585] px-1 rounded">{test.category}</span>
                  </div>
                  <p className="text-[10px] text-[#858585] mt-0.5 leading-tight">{test.description}</p>
                  {test.error && (
                    <div className="mt-2 p-2 bg-red-900/10 border border-red-500/20 rounded text-red-400 text-[9px] font-mono whitespace-pre-wrap">
                      <AlertTriangle size={10} className="inline mr-1" /> {test.error}
                    </div>
                  )}
                </div>
              </div>
              {test.duration && (
                <span className="text-[9px] text-[#666666] font-mono">{Math.round(test.duration)}ms</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-[#2d2d2d] border-t border-[#333333]">
        <p className="text-[10px] text-[#858585] italic">
          Integration tests exercise Gemini AI models directly to ensure prompt accuracy and safety logic.
        </p>
      </div>
    </div>
  );
};

export default TestDashboard;
