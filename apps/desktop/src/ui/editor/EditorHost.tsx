import React from 'react';
import Editor from '@monaco-editor/react';

interface Props {
  value: string;
  language: string;
  onChange: (val: string) => void;
}

const EditorHost: React.FC<Props> = ({ value, language, onChange }) => {
  return (
    <Editor
      height="100%"
      theme="vs-dark"
      value={value}
      defaultLanguage={language}
      onChange={(v) => onChange(v ?? '')}
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

