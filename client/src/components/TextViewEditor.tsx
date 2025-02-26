import React from 'react';
import { Editor } from '@monaco-editor/react';

import { isCodeText, getMonacoLanguage } from '../utils/fileTypeHelpers';

interface CodeOrTextEditorProps {
  fileType: string;
  content: string;
  onChange?: (newValue: string) => void;
  readOnly?: boolean;
}

const CodeOrTextEditor: React.FC<CodeOrTextEditorProps> = ({
  fileType,
  content,
  onChange,
  readOnly = false,
}) => {
  const isCode = isCodeText(fileType);
  const language = getMonacoLanguage(fileType);

  if (isCode) {
    // Use the Monaco Editor
    return (
      <Editor
        height="80vh"
        defaultLanguage={language}
        value={content}
        onChange={(value) => {
          if (onChange) {
            onChange(value || '');
          }
        }}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          wordWrap: 'on',
          scrollBeyondLastLine: false,
        }}
      />
    );
  } else {
    // Plain text. If readOnly, show a <pre>. Else show <textarea>.
    if (readOnly) {
      return (
        <pre
          style={{
            width: '100%',
            height: '80vh',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            backgroundColor: '#f4f4f4',
            padding: '10px',
            borderRadius: '5px',
            textAlign: 'left',
            fontFamily: 'monospace',
          }}
        >
          {content}
        </pre>
      );
    } else {
      return (
        <textarea
          style={{ width: '100%', height: '80vh' }}
          value={content}
          onChange={(e) => onChange?.(e.target.value)}
        />
      );
    }
  }
};

export default CodeOrTextEditor;
