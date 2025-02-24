import React from 'react';
import Editor from '@monaco-editor/react';
import { getMonacoLanguage, isCodeText } from '../../utils/fileTypeHelpers';

interface TextPreviewProps {
  content: string;
  fileType: string;
}

const TextPreview: React.FC<TextPreviewProps> = ({ content, fileType }) => {
  const isCode = isCodeText(fileType);
  const language = getMonacoLanguage(fileType);

  return isCode ? (
    <Editor
      height="80vh"
      defaultLanguage={language}
      defaultValue={content}
      theme="vs-dark"
      options={{
        readOnly: true,
        minimap: { enabled: false },
        wordWrap: 'on',
        scrollBeyondLastLine: false,
      }}
    />
  ) : (
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
};

export default TextPreview;
