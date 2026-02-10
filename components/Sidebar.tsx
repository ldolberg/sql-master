
import React from 'react';
import { 
  FolderIcon, 
  SearchIcon, 
  HistoryIcon, 
  SettingsIcon,
  PlusIcon,
  FlaskConicalIcon,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'files' | 'search' | 'history' | 'settings' | 'tests' | 'chat';
  setActiveTab: (tab: 'files' | 'search' | 'history' | 'settings' | 'tests' | 'chat') => void;
  onNewSnippet: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onNewSnippet }) => {
  const tabs = [
    { id: 'files', icon: FolderIcon, label: 'Snippets' },
    { id: 'search', icon: SearchIcon, label: 'Search' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'history', icon: HistoryIcon, label: 'Recent' },
    { id: 'tests', icon: FlaskConicalIcon, label: 'Tests' },
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
      
      <div className="flex-1" />

      <button 
        onClick={onNewSnippet}
        className="p-2 text-[#858585] hover:text-white transition-colors"
        title="New Snippet"
      >
        <PlusIcon size={24} />
      </button>

      <button
        onClick={() => setActiveTab('settings')}
        title="Settings"
        className={`p-2 transition-colors duration-200 relative group ${
          activeTab === 'settings' ? 'text-white' : 'text-[#858585] hover:text-white'
        }`}
      >
        {activeTab === 'settings' && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white" />
        )}
        <SettingsIcon size={24} />
      </button>
    </div>
  );
};

export default Sidebar;
