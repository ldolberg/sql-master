import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo } from 'react';
import { ChevronDown, ChevronRight, FileCode, Tag } from 'lucide-react';
const SnippetExplorer = ({ snippets, selectedId, onSelect }) => {
    const groups = useMemo(() => {
        const grouped = {};
        snippets.forEach(s => {
            const cat = s.category || 'General';
            if (!grouped[cat])
                grouped[cat] = [];
            grouped[cat].push(s);
        });
        return grouped;
    }, [snippets]);
    return (_jsxs("div", { className: "flex-1 overflow-y-auto bg-[#252526] text-xs font-medium", children: [_jsx("div", { className: "px-4 py-2 text-[10px] uppercase tracking-wider text-[#bbbbbb] flex justify-between items-center", children: _jsx("span", { children: "Explorer" }) }), Object.entries(groups).map(([category, items]) => (_jsx(CategoryGroup, { name: category, snippets: items, selectedId: selectedId, onSelect: onSelect }, category))), snippets.length === 0 && (_jsx("div", { className: "p-8 text-center text-[#858585]", children: "No snippets found. Click \"+\" to create one." }))] }));
};
const CategoryGroup = ({ name, snippets, selectedId, onSelect }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    return (_jsxs("div", { children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: "w-full flex items-center px-1 py-1 hover:bg-[#2a2d2e] group transition-colors", children: [isOpen ? _jsx(ChevronDown, { size: 16 }) : _jsx(ChevronRight, { size: 16 }), _jsx("span", { className: "ml-1 text-[#cccccc] font-bold", children: name }), _jsx("span", { className: "ml-auto mr-2 text-[10px] text-[#858585]", children: snippets.length })] }), isOpen && (_jsx("div", { className: "pl-4", children: snippets.map(s => (_jsxs("button", { onClick: () => onSelect(s.id), className: `w-full flex items-center px-2 py-1.5 hover:bg-[#2a2d2e] group border-l-2 ${selectedId === s.id ? 'bg-[#37373d] border-[#007acc]' : 'border-transparent'}`, children: [_jsx(FileCode, { size: 14, className: "text-[#519aba] mr-2" }), _jsxs("div", { className: "flex flex-col items-start truncate", children: [_jsx("span", { className: "text-[#cccccc] truncate", children: s.name || 'Untitled Snippet' }), _jsx("div", { className: "flex gap-1 mt-0.5 opacity-60 group-hover:opacity-100", children: s.tags.slice(0, 2).map(t => (_jsxs("span", { className: "text-[9px] bg-[#333333] px-1 rounded flex items-center", children: [_jsx(Tag, { size: 8, className: "mr-0.5" }), " ", t] }, t))) })] }), _jsxs("span", { className: "ml-auto text-[10px] text-[#858585] group-hover:block hidden", children: [s.usageCount, "x"] })] }, s.id))) }))] }));
};
export default SnippetExplorer;
