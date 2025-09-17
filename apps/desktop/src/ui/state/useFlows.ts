import React from 'react';

export interface FlowItem {
  id: string;
  title: string;
  done: boolean;
}

const KEY = 'rainvibe.flows.items';

export function useFlows() {
  const [items, setItems] = React.useState<FlowItem[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) as FlowItem[] : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const add = (title: string) => {
    const id = Math.random().toString(36).slice(2);
    setItems(prev => [...prev, { id, title, done: false }]);
  };

  const toggle = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  const remove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return { items, add, toggle, remove };
}

