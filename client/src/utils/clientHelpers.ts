export const isSupportedFileTypeText = (fileType: string) => {
  return (
    (fileType.startsWith('text/') ||
      fileType === 'application/json' ||
      fileType === 'application/xml' ||
      fileType === 'application/x-sh' || // Shell scripts
      fileType === 'application/x-httpd-php' || // PHP scripts
      fileType === 'application/x-yaml' ||
      fileType === 'application/x-toml' ||
      fileType === 'application/javascript' ||
      fileType === 'application/ecmascript' ||
      fileType.includes('json') || // Covers application/ld+json, etc.
      fileType.includes('xml') || // Covers various XML-based formats
      fileType.includes('yaml') ||
      fileType.includes('toml') ||
      fileType.includes('csv') ||
      fileType.includes('sql') ||
      fileType.includes('latex') ||
      fileType.includes('python') ||
      fileType.includes('java') ||
      fileType.includes('javascript') ||
      fileType.includes('typescript') ||
      fileType.includes('html') ||
      fileType.includes('css') ||
      fileType.includes('scss') ||
      fileType.includes('less') ||
      fileType.includes('php') ||
      fileType.includes('ruby') ||
      fileType.includes('perl') ||
      fileType.includes('lua') ||
      fileType.includes('rust') ||
      fileType.includes('go') ||
      fileType.includes('kotlin') ||
      fileType.includes('swift') ||
      fileType.includes('csharp') ||
      fileType.includes('cpp') ||
      fileType.endsWith('c') ||
      fileType.endsWith('h') ||
      fileType.endsWith('r') ||
      fileType.includes('dart') ||
      fileType.includes('scala') ||
      fileType.includes('groovy') ||
      fileType.includes('bat') || // Windows batch scripts
      fileType.includes('cmd') || // Windows command scripts
      fileType.includes('ini') || // Configuration files
      fileType.includes('properties') || // Java .properties files
      fileType.includes('md') || // Markdown
      fileType.includes('txt') || // Plain text
      fileType.includes('log')) && // Log files
    fileType !==
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
    fileType !== 'application/msword'
  );
};

export const isSupportedFileTypeVideo = (fileType: string) => {
  return fileType.startsWith('video/') && fileType !== 'video/quicktime';
};

export {};
