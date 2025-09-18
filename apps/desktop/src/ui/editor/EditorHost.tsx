import React from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';

interface Props {
  value: string;
  language: string;
  onChange: (val: string) => void;
  inlineAutocompleteEnabled?: boolean;
  diagnostics?: Array<{ message: string; severity: 'error' | 'warning' | 'info'; startLine: number; startColumn: number; endLine: number; endColumn: number }>
  minimap?: boolean;
  onReady?: (api: { revealPosition: (line: number, column: number) => void; trigger: (actionId: string) => void }) => void;
}

const EditorHost: React.FC<Props> = ({ value, language, onChange, inlineAutocompleteEnabled, diagnostics, minimap, onReady }) => {
  const editorRef = React.useRef<any>(null);
  const monacoRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!editorRef.current) return;
    if (onReady) {
      onReady({
        revealPosition: (line, column) => {
          try { editorRef.current.revealPositionInCenter({ lineNumber: line, column }); editorRef.current.setPosition({ lineNumber: line, column }); editorRef.current.focus(); } catch {}
        },
        trigger: async (actionId: string) => {
          try {
            const action = editorRef.current.getAction?.(actionId);
            if (action) { await action.run(); return; }
            editorRef.current.trigger('keyboard', actionId, null);
          } catch {}
        }
      });
    }
    const handler = (e: any) => {
      try {
        const { line, col } = e.detail || {};
        if (typeof line === 'number' && typeof col === 'number') {
          editorRef.current.revealPositionInCenter({ lineNumber: line, column: col });
          editorRef.current.setPosition({ lineNumber: line, column: col });
          editorRef.current.focus();
        }
      } catch {}
    };
    window.addEventListener('rainvibe:goto', handler as any);
    return () => window.removeEventListener('rainvibe:goto', handler as any);
  }, [editorRef.current]);

  React.useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;
    const severityMap: Record<string, number> = {
      error: monaco.MarkerSeverity.Error,
      warning: monaco.MarkerSeverity.Warning,
      info: monaco.MarkerSeverity.Info,
    };
    const markers = (diagnostics ?? []).map(d => ({
      message: d.message,
      severity: severityMap[d.severity] ?? monaco.MarkerSeverity.Info,
      startLineNumber: d.startLine,
      startColumn: d.startColumn,
      endLineNumber: d.endLine,
      endColumn: d.endColumn,
    }));
    monaco.editor.setModelMarkers(model, 'rainvibe', markers);
  }, [diagnostics]);

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      value={value}
      defaultLanguage={language}
      onChange={(v) => onChange(v ?? '')}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
      }}
      beforeMount={(monaco) => {
        if (!inlineAutocompleteEnabled) return;
        monaco.languages.registerInlineCompletionsProvider(language as any, {
          provideInlineCompletions: (model, position) => {
            const text = model.getValueInRange({ startLineNumber: Math.max(1, position.lineNumber - 1), startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });
            const suggestion = text.trim().length ? ' // continue...' : '';
            return {
              items: suggestion ? [{
                insertText: suggestion,
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
              }] : [],
              dispose: () => {},
            } as any;
          },
          freeInlineCompletions: () => {},
        } as any);
      }}
      options={{
        minimap: { enabled: minimap !== false },
        fontLigatures: true,
        fontFamily: 'Consolas, "JetBrains Mono", "Source Code Pro", monospace',
        renderWhitespace: 'none',
        automaticLayout: true,
      }}
    />
  );
};

export default EditorHost;

