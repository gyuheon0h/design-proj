import React from 'react';
import TextViewer from './TextViewer';

interface TextPreviewProps {
  content: string;
  fileType: string;
}

const TextPreview: React.FC<TextPreviewProps> = ({ content, fileType }) => {
  return <TextViewer content={content} fileType={fileType} />;
};

export default TextPreview;
