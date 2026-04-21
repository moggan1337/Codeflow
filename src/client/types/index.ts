export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerUsername?: string;
  visibility: 'public' | 'private' | 'team';
  settings?: ProjectSettings;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSettings {
  theme?: string;
  fontSize?: number;
  tabSize?: number;
  autoSave?: boolean;
  git?: GitSettings;
}

export interface GitSettings {
  repositoryId?: string;
  branches?: string[];
  currentBranch?: string;
  commits?: GitCommit[];
  initialized?: boolean;
  initializedAt?: string;
}

export interface GitCommit {
  id: string;
  message: string;
  author: {
    id: string;
    username: string;
  };
  timestamp: string;
  branch: string;
  files: string[];
  parent?: string | null;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  staged: string[];
  untracked: string[];
  clean: boolean;
}

export interface File {
  id: string;
  path: string;
  content?: string;
  language?: string;
  isDirectory: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  projectId: string;
  fileId: string;
  userId: string;
  username?: string;
  avatarUrl?: string;
  content: string;
  lineStart?: number;
  lineEnd?: number;
  resolved: boolean;
  parentId?: string;
  createdAt: string;
}

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  avatar?: string;
  lastActivity: number;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
  fileId: string;
}

export interface SelectionRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  fileId: string;
}

export interface ExecutionResult {
  executionId: string;
  result: {
    stdout: string;
    stderr: string;
    output: string;
    error?: string;
    exitCode: number;
  };
  executionTime: number;
  language: string;
}

export interface Language {
  name: string;
  displayName: string;
  dockerImage: string;
  timeout: number;
  supported: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { name: 'javascript', displayName: 'JavaScript', dockerImage: 'node:20-alpine', timeout: 30000, supported: true },
  { name: 'typescript', displayName: 'TypeScript', dockerImage: 'node:20-alpine', timeout: 60000, supported: true },
  { name: 'python', displayName: 'Python', dockerImage: 'python:3.11-alpine', timeout: 30000, supported: true },
  { name: 'java', displayName: 'Java', dockerImage: 'openjdk:17-alpine', timeout: 60000, supported: true },
  { name: 'cpp', displayName: 'C++', dockerImage: 'gcc:13', timeout: 60000, supported: true },
  { name: 'c', displayName: 'C', dockerImage: 'gcc:13', timeout: 60000, supported: true },
  { name: 'go', displayName: 'Go', dockerImage: 'golang:1.21-alpine', timeout: 60000, supported: true },
  { name: 'rust', displayName: 'Rust', dockerImage: 'rust:1.75-alpine', timeout: 120000, supported: true },
  { name: 'ruby', displayName: 'Ruby', dockerImage: 'ruby:3.2-alpine', timeout: 30000, supported: true },
  { name: 'php', displayName: 'PHP', dockerImage: 'php:8.2-cli', timeout: 30000, supported: true },
  { name: 'swift', displayName: 'Swift', dockerImage: 'swift:5.9', timeout: 60000, supported: true },
  { name: 'kotlin', displayName: 'Kotlin', dockerImage: 'jetbrains/kotlin:1.9.22', timeout: 120000, supported: true },
  { name: 'scala', displayName: 'Scala', dockerImage: 'scala:2.13', timeout: 120000, supported: true },
  { name: 'r', displayName: 'R', dockerImage: 'r:4.3', timeout: 60000, supported: true },
  { name: 'perl', displayName: 'Perl', dockerImage: 'perl:5.38', timeout: 30000, supported: true },
  { name: 'lua', displayName: 'Lua', dockerImage: 'lua:5.4', timeout: 30000, supported: true },
  { name: 'haskell', displayName: 'Haskell', dockerImage: 'haskell:9.6', timeout: 120000, supported: true },
  { name: 'elixir', displayName: 'Elixir', dockerImage: 'elixir:1.15', timeout: 60000, supported: true },
  { name: 'erlang', displayName: 'Erlang', dockerImage: 'erlang:26', timeout: 60000, supported: true },
  { name: 'clojure', displayName: 'Clojure', dockerImage: 'clojure:1.11', timeout: 60000, supported: true },
  { name: 'fsharp', displayName: 'F#', dockerImage: 'mcr.microsoft.com/dotnet/sdk', timeout: 60000, supported: true },
  { name: 'dart', displayName: 'Dart', dockerImage: 'dart:3.2', timeout: 60000, supported: true },
  { name: 'julia', displayName: 'Julia', dockerImage: 'julia:1.10', timeout: 60000, supported: true },
  { name: 'matlab', displayName: 'MATLAB', dockerImage: 'matlab:r2023a', timeout: 120000, supported: true },
  { name: 'octave', displayName: 'Octave', dockerImage: 'octave:8.2', timeout: 60000, supported: true },
  { name: 'fortran', displayName: 'Fortran', dockerImage: 'fortran-lang/fortran', timeout: 60000, supported: true },
  { name: 'cobol', displayName: 'COBOL', dockerImage: 'cobol', timeout: 60000, supported: true },
  { name: 'pascal', displayName: 'Pascal', dockerImage: 'free-pascal/lazarus', timeout: 60000, supported: true },
  { name: 'prolog', displayName: 'Prolog', dockerImage: 'swipl', timeout: 60000, supported: true },
  { name: 'lisp', displayName: 'Lisp', dockerImage: 'sabadi/lisp', timeout: 60000, supported: true },
  { name: 'scheme', displayName: 'Scheme', dockerImage: 'racket', timeout: 60000, supported: true },
  { name: 'racket', displayName: 'Racket', dockerImage: 'racket', timeout: 60000, supported: true },
  { name: 'ocaml', displayName: 'OCaml', dockerImage: 'ocaml:5.1', timeout: 60000, supported: true },
  { name: 'haskell', displayName: 'Haskell', dockerImage: 'haskell:9.6', timeout: 120000, supported: true },
  { name: 'sql', displayName: 'SQL', dockerImage: 'postgres:16-alpine', timeout: 30000, supported: true },
  { name: 'bash', displayName: 'Bash', dockerImage: 'bash:5.2', timeout: 30000, supported: true },
  { name: 'powershell', displayName: 'PowerShell', dockerImage: 'mcr.microsoft.com/powershell', timeout: 30000, supported: true },
  { name: 'dockerfile', displayName: 'Dockerfile', dockerImage: 'docker', timeout: 60000, supported: true },
  { name: 'yaml', displayName: 'YAML', dockerImage: '', timeout: 0, supported: true },
  { name: 'json', displayName: 'JSON', dockerImage: '', timeout: 0, supported: true },
  { name: 'xml', displayName: 'XML', dockerImage: '', timeout: 0, supported: true },
  { name: 'html', displayName: 'HTML', dockerImage: '', timeout: 0, supported: true },
  { name: 'css', displayName: 'CSS', dockerImage: '', timeout: 0, supported: true },
  { name: 'scss', displayName: 'SCSS', dockerImage: '', timeout: 0, supported: true },
  { name: 'less', displayName: 'Less', dockerImage: '', timeout: 0, supported: true },
  { name: 'markdown', displayName: 'Markdown', dockerImage: '', timeout: 0, supported: true },
  { name: 'latex', displayName: 'LaTeX', dockerImage: 'texlive', timeout: 60000, supported: true },
  { name: 'terraform', displayName: 'Terraform', dockerImage: 'hashicorp/terraform', timeout: 60000, supported: true },
  { name: 'graphql', displayName: 'GraphQL', dockerImage: '', timeout: 0, supported: true },
  { name: 'proto', displayName: 'Protocol Buffers', dockerImage: '', timeout: 0, supported: true },
  { name: 'cmake', displayName: 'CMake', dockerImage: 'cmake:3.28', timeout: 60000, supported: true },
  { name: 'makefile', displayName: 'Makefile', dockerImage: 'gcc:13', timeout: 30000, supported: true },
  { name: 'nginx', displayName: 'Nginx', dockerImage: '', timeout: 0, supported: true },
];

export const getLanguageFromExtension = (filename: string): string => {
  const extensionMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    kts: 'kotlin',
    scala: 'scala',
    r: 'r',
    R: 'r',
    pl: 'perl',
    lua: 'lua',
    hs: 'haskell',
    ex: 'elixir',
    exs: 'elixir',
    erl: 'erlang',
    clj: 'clojure',
    fs: 'fsharp',
    fsx: 'fsharp',
    dart: 'dart',
    jl: 'julia',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    yaml: 'yaml',
    yml: 'yaml',
    json: 'json',
    xml: 'xml',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    less: 'less',
    md: 'markdown',
    tex: 'latex',
    tf: 'terraform',
    graphql: 'graphql',
    gql: 'graphql',
    proto: 'proto',
    cmake: 'cmake',
    makefile: 'makefile',
    Makefile: 'makefile',
    conf: 'nginx',
    nginx: 'nginx',
  };

  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return extensionMap[ext] || 'plaintext';
};
