export const isSupportedFileTypeText = (fileType: string) => {
  const exactMatches = new Set([
    'application/json',
    'application/xml',
    'application/x-sh', // Shell scripts
    'application/x-httpd-php', // PHP scripts
    'application/x-yaml',
    'application/x-toml',
    'application/javascript',
    'application/ecmascript',
  ]);

  const excludedTypes = new Set([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ]);

  const partialMatches = [
    'text/',
    'json',
    'xml',
    'yaml',
    'toml',
    'csv',
    'sql',
    'latex',
    'python',
    'java',
    'javascript',
    'typescript',
    'html',
    'css',
    'scss',
    'less',
    'php',
    'ruby',
    'perl',
    'lua',
    'rust',
    'go',
    'kotlin',
    'swift',
    'csharp',
    'cpp',
    '.c',
    '.h',
    '.r',
    'dart',
    'scala',
    'groovy',
    'bat', // Windows batch scripts
    'cmd', // Windows command scripts
    'ini', // Configuration files
    'properties', // Java .properties files
    'md', // Markdown
    'txt', // Plain text
    'log', // Log files
  ];

  return (
    (exactMatches.has(fileType) ||
      partialMatches.some((match) => fileType.includes(match))) &&
    !excludedTypes.has(fileType)
  );
};

export const isSupportedFileTypeVideo = (fileType: string) => {
  return fileType.startsWith('video/') && fileType !== 'video/quicktime';
};

export const isCodeText = (fileType: string) => {
  const codeFileTypes = new Set([
    'application/json',
    'application/xml',
    'application/x-sh', // Shell scripts
    'application/x-httpd-php', // PHP scripts
    'application/x-yaml',
    'application/x-toml',
    'application/javascript',
    'application/ecmascript',
  ]);

  return (
    codeFileTypes.has(fileType) || getMonacoLanguage(fileType) !== 'plaintext'
  );
};

export const getMonacoLanguage = (fileType: string) => {
  if (fileType.includes('javascript') || fileType.includes('ecmascript'))
    return 'javascript';
  if (fileType.includes('typescript')) return 'typescript';
  if (fileType.includes('python')) return 'python';
  if (fileType.includes('java')) return 'java';
  if (fileType.includes('html') || fileType.includes('xml')) return 'html';
  if (
    fileType.includes('css') ||
    fileType.includes('scss') ||
    fileType.includes('less')
  )
    return 'css';
  if (fileType.includes('x-c')) return 'c';
  if (fileType.includes('php')) return 'php';
  if (fileType.includes('ruby')) return 'ruby';
  if (fileType.includes('perl')) return 'perl';
  if (fileType.includes('lua')) return 'lua';
  if (fileType.includes('rust')) return 'rust';
  if (fileType.includes('go')) return 'go';
  if (fileType.includes('kotlin')) return 'kotlin';
  if (fileType.includes('swift')) return 'swift';
  if (fileType.includes('csharp')) return 'csharp';
  if (fileType.includes('cpp') || fileType.includes('c++')) return 'cpp';
  if (fileType.includes('dart')) return 'dart';
  if (fileType.includes('scala')) return 'scala';
  if (fileType.includes('sql')) return 'sql';
  if (fileType.includes('yaml') || fileType.includes('toml')) return 'yaml';

  return 'plaintext';
};

export {};
