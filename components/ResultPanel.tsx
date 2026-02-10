
import React from 'react';
import { QueryResult } from '../types';
import { Table, Clock, AlertCircle, Info } from 'lucide-react';

interface ResultPanelProps {
  result: QueryResult | null;
  isLoading: boolean;
}

const ResultPanel: React.FC<ResultPanelProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#858585] bg-[#1e1e1e]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p>Executing query...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#858585] bg-[#1e1e1e]">
        <Table size={48} strokeWidth={1} className="mb-2 opacity-20" />
        <p>No results to display</p>
        <p className="text-xs">Run a query to see the data here</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333333] text-[11px] text-[#858585]">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <Clock size={12} className="mr-1" /> {result.executionTime}ms
          </span>
          <span className="flex items-center">
             <Info size={12} className="mr-1" /> {result.rows.length} rows
          </span>
        </div>
        <div className="text-[#4ec9b0] font-medium">
          {result.message}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-[#252526] z-10 shadow-sm">
            <tr>
              {result.columns.map(col => (
                <th key={col} className="px-4 py-2 border-b border-[#333333] text-[#bbbbbb] font-semibold uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#2a2d2e] group">
                {result.columns.map(col => (
                  <td key={col} className="px-4 py-2 border-b border-[#333333] text-[#cccccc] font-mono whitespace-nowrap">
                    {String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={result.columns.length} className="px-4 py-8 text-center text-[#858585]">
                  Result set is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultPanel;
