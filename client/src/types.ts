export interface RepositoryFile {
  path: string;
  content: string;
}

export interface ProcessingStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

export interface ProcessingResult {
  content: string;
  fileCount: number;
  lineCount: number;
}

export interface RepositoryLog {
  id: number;
  repositoryUrl: string;
  fileCount: number;
  lineCount: number;
  processedAt: string;
  success: boolean;
  errorMessage: string | null;
}
