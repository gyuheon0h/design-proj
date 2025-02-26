import React from 'react';
import Editor from '@monaco-editor/react';
import { getMonacoLanguage, isCodeText } from '../utils/fileTypeHelpers';
import TextViewer from './TextViewer';

interface TextPreviewProps {
  content: string;
  fileType: string;
}

const TextPreview: React.FC<TextPreviewProps> = ({ content, fileType }) => {
  return <TextViewer content={content} fileType={fileType} />;
};

export default TextPreview;
