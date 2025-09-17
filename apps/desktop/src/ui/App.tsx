import React from 'react';
import ModeToggle from './components/ModeToggle';
import EditorHost from './editor/EditorHost';

const TopBar: React.FC = () => {
  return (
    <div className="flex items-center justify-between px-3 h-10 border-b border-white/10 bg-black text-white">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-sm gradient-accent" />
        <span className="font-semibold tracking-wide">RainVibe</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="opacity-70">Modes:</span>
        <ModeToggle active={['Basic']} onChange={() => {}} />
      </div>
    </div>
  );
};

const StatusBar: React.FC = () => {
  return (
    <div className="h-6 text-xs px-3 flex items-center gap-4 border-t border-white/10 bg-black text-white/80">
      <span>model: ChatGPT</span>
      <span>mode: Basic</span>
      <span>policy: off</span>
      <span>audit: off</span>
      <span>tokens: 0%</span>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="h-full w-full flex flex-col bg-black text-white">
      <TopBar />
      <div className="flex-1 grid grid-cols-[260px_minmax(0,1fr)_360px] grid-rows-[minmax(0,1fr)]">
        <aside className="border-r border-white/10 p-2">
          <div className="text-sm font-semibold mb-2">Workspace</div>
          <div className="text-xs opacity-70">Open a folder to begin.</div>
        </aside>
        <main className="p-0">
          <div className="h-full w-full bg-black">
            <EditorHost value={""} language="typescript" onChange={() => {}} />
          </div>
        </main>
        <aside className="border-l border-white/10 p-2">
          <div className="text-sm font-semibold mb-2">Assistant Panel</div>
          <div className="text-xs opacity-70">Chat | Tasks | Modes | Trails</div>
        </aside>
      </div>
      <StatusBar />
    </div>
  );
};

export default App;

