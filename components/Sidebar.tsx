
import React from 'react';
import { 
  FolderIcon, 
  SearchIcon, 
  HistoryIcon, 
  PlayIcon,
  CodeIcon,
  PlusIcon
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'files' | 'search' | 'history';
  setActiveTab: (tab: 'files' | 'search' | 'history') => void;
  onNewSnippet: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onNewSnippet }) => {
  const tabs = [
    { id: 'files', icon: FolderIcon, label: 'Snippets' },
    { id: 'search', icon: SearchIcon, label: 'Search' },
    { id: 'history', icon: HistoryIcon, label: 'Recent' },
  ] as const;

  return (
    <div className="w-12 md:w-16 bg-[#333333] flex flex-col items-center py-4 space-y-4 border-r border-[#1e1e1e]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          title={tab.label}
          className={`p-2 transition-colors duration-200 relative group ${
            activeTab === tab.id ? 'text-white' : 'text-[#858585] hover:text-white'
          }`}
        >
          {activeTab === tab.id && (
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
          )}
          <tab.icon size={24} />
          <span className="sr-only">{tab.label}</span>
        </button>
      ))}
      <div className="mt-auto">
        <button 
          onClick={onNewSnippet}
          className="p-2 text-[#858585] hover:text-white transition-colors"
          title="New Snippet"
        >
          <PlusIcon size={24} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
