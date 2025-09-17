import React from 'react';

type Tab = 'Chat' | 'Tasks' | 'Modes' | 'Trails';

const tabs: Tab[] = ['Chat', 'Tasks', 'Modes', 'Trails'];

interface Props {
  open: boolean;
}

const AssistantPanel: React.FC<Props> = ({ open }) => {
  const [tab, setTab] = React.useState<Tab>('Chat');
  if (!open) return null;
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex gap-2 border-b border-white/10 px-2 h-8 items-center text-sm">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-0.5 rounded ${tab === t ? 'bg-white/20' : 'hover:bg-white/10'} border border-white/10`}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 p-2 text-xs opacity-80">
        {tab === 'Chat' && <div>Chat coming soon.</div>}
        {tab === 'Tasks' && <div>Tasks and Flows coming soon.</div>}
        {tab === 'Modes' && <div>Toggle and configure Modes here.</div>}
        {tab === 'Trails' && <div>Audit Trails will appear here.</div>}
      </div>
    </div>
  );
};

export default AssistantPanel;

