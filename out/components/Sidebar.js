import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FolderIcon, SearchIcon, HistoryIcon, SettingsIcon, PlusIcon, FlaskConicalIcon, MessageSquare } from 'lucide-react';
const Sidebar = ({ activeTab, setActiveTab, onNewSnippet }) => {
    const tabs = [
        { id: 'files', icon: FolderIcon, label: 'Snippets' },
        { id: 'search', icon: SearchIcon, label: 'Search' },
        { id: 'chat', icon: MessageSquare, label: 'Chat' },
        { id: 'history', icon: HistoryIcon, label: 'Recent' },
        { id: 'tests', icon: FlaskConicalIcon, label: 'Tests' },
    ];
    return (_jsxs("div", { className: "w-12 md:w-16 bg-[#333333] flex flex-col items-center py-4 space-y-4 border-r border-[#1e1e1e]", children: [tabs.map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.id), title: tab.label, className: `p-2 transition-colors duration-200 relative group ${activeTab === tab.id ? 'text-white' : 'text-[#858585] hover:text-white'}`, children: [activeTab === tab.id && (_jsx("div", { className: "absolute left-0 top-0 bottom-0 w-0.5 bg-white" })), _jsx(tab.icon, { size: 24 }), _jsx("span", { className: "sr-only", children: tab.label })] }, tab.id))), _jsx("div", { className: "flex-1" }), _jsx("button", { onClick: onNewSnippet, className: "p-2 text-[#858585] hover:text-white transition-colors", title: "New Snippet", children: _jsx(PlusIcon, { size: 24 }) }), _jsxs("button", { onClick: () => setActiveTab('settings'), title: "Settings", className: `p-2 transition-colors duration-200 relative group ${activeTab === 'settings' ? 'text-white' : 'text-[#858585] hover:text-white'}`, children: [activeTab === 'settings' && (_jsx("div", { className: "absolute left-0 top-0 bottom-0 w-0.5 bg-white" })), _jsx(SettingsIcon, { size: 24 })] })] }));
};
export default Sidebar;
