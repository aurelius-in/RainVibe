import React from 'react';
import Editor, { loader, DiffEditor } from '@monaco-editor/react';

interface Props {
  value: string;
  language: string;
  onChange: (val: string) => void;
  inlineAutocompleteEnabled?: boolean;
}

const EditorHost: React.FC<Props> = ({ value, language, onChange, inlineAutocompleteEnabled }) => {
  return (
    <Editor
      height="100%"
      theme="vs-dark"
      value={value}
      defaultLanguage={language}
      onChange={(v) => onChange(v ?? '')}
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
        minimap: { enabled: true },
        fontLigatures: true,
        fontFamily: 'Consolas, "JetBrains Mono", "Source Code Pro", monospace',
        renderWhitespace: 'none',
        automaticLayout: true,
      }}
    />
  );
};

export default EditorHost;

