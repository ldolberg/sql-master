
import React, { useMemo } from 'react';
import { SQLSnippet } from '../types';
import { ChevronDown, ChevronRight, FileCode, Tag } from 'lucide-react';

interface SnippetExplorerProps {
  snippets: SQLSnippet[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const SnippetExplorer: React.FC<SnippetExplorerProps> = ({ snippets, selectedId, onSelect }) => {
  const groups = useMemo(() => {
    const grouped: Record<string, SQLSnippet[]> = {};
    snippets.forEach(s => {
      const cat = s.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });
    return grouped;
  }, [snippets]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#252526] text-xs font-medium">
      <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-[#bbbbbb] flex justify-between items-center">
        <span>Explorer</span>
      </div>
      
      {Object.entries(groups).map(([category, items]) => (
        <CategoryGroup 
          key={category} 
          name={category} 
          snippets={items} 
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}

      {snippets.length === 0 && (
        <div className="p-8 text-center text-[#858585]">
          No snippets found. Click "+" to create one.
        </div>
      )}
    </div>
  );
};

const CategoryGroup: React.FC<{ 
  name: string; 
  snippets: SQLSnippet[]; 
  selectedId: string | null;
  onSelect: (id: string) => void;
}> = ({ name, snippets, selectedId, onSelect }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center px-1 py-1 hover:bg-[#2a2d2e] group transition-colors"
      >
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="ml-1 text-[#cccccc] font-bold">{name}</span>
        <span className="ml-auto mr-2 text-[10px] text-[#858585]">{snippets.length}</span>
      </button>
      
      {isOpen && (
        <div className="pl-4">
          {snippets.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full flex items-center px-2 py-1.5 hover:bg-[#2a2d2e] group border-l-2 ${
                selectedId === s.id ? 'bg-[#37373d] border-[#007acc]' : 'border-transparent'
              }`}
            >
              <FileCode size={14} className="text-[#519aba] mr-2" />
              <div className="flex flex-col items-start truncate">
                <span className="text-[#cccccc] truncate">{s.name || 'Untitled Snippet'}</span>
                <div className="flex gap-1 mt-0.5 opacity-60 group-hover:opacity-100">
                  {s.tags.slice(0, 2).map(t => (
                    <span key={t} className="text-[9px] bg-[#333333] px-1 rounded flex items-center">
                      <Tag size={8} className="mr-0.5" /> {t}
                    </span>
                  ))}
                </div>
              </div>
              <span className="ml-auto text-[10px] text-[#858585] group-hover:block hidden">
                {s.usageCount}x
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SnippetExplorer;
