export interface UploadStatus {
  id: string;
  fileName: string;
  progress: number;
  status: "not started" | "in progress" | "completed" | "error";
  error?: string;
}