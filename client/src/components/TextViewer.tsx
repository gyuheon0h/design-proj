import React from 'react';
import { Editor } from '@monaco-editor/react';

import { isCodeText, getMonacoLanguage } from '../utils/fileTypeHelpers';

interface TextViewerProps {
  fileType: string;
  content: string;
  onChange?: (newValue: string) => void;
  readOnly?: boolean;
}

const TextViewer: React.FC<TextViewerProps> = ({
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
    return (
      <textarea
        readOnly={readOnly}
        style={{ width: '100%', height: '80vh' }}
        value={content}
        onChange={(e) => onChange?.(e.target.value)}
      />
    );
  }
};

export default TextViewer;
