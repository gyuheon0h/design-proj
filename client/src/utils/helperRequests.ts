import axios from 'axios';
import { FileComponentProps } from '../components/File';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';

export async function getBlobGcskey(
  gcsKey: string,
  fileType: string,
): Promise<Blob> {
  try {
    const response = await axios.post(
      `http://localhost:5001/api/file/view`,
      { gcsKey, fileType },
      { responseType: 'blob' },
    );
    const imageBlob = response.data;
    return imageBlob;
  } catch {
    console.error('Error fetching image blob');
    return new Blob();
  }
}

export async function getUsernameById(id: string): Promise<string> {
  try {
    const response = await axios.get(`http://localhost:5001/api/user/`, {
      params: { id },
    });
    return response.data?.user.username || '';
  } catch (error) {
    console.error('Error fetching username:', error);
    return '';
  }
}

export async function downloadFile(
  fileId: string,
  fileName: string,
): Promise<void> {
  try {
    const response = await axios.get(
      `http://localhost:5001/api/file/download/${fileId}`,
      {
        responseType: 'blob',
        withCredentials: true,
      },
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'download';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download failed', error);
  }
}

export async function fetchFolderNames(
  folderIds: string[],
): Promise<{ [key: string]: string }> {
  try {
    const nameRequests = folderIds.map((id) =>
      axios.get(`http://localhost:5001/api/folder/foldername/${id}`),
    );
    const nameResponses = await Promise.all(nameRequests);

    const folderNames: { [key: string]: string } = {};
    folderIds.forEach((id, index) => {
      folderNames[id] = nameResponses[index].data;
    });

    return folderNames;
  } catch (error) {
    console.error('Error fetching folder names:', error);
    return {};
  }
}

export function applyFilters(
  files: FileComponentProps[],
  fileTypeFilter: string | null,
  createdAtFilter: string | null,
  modifiedAtFilter: string | null,
): FileComponentProps[] {
  return files.filter((file) => {
    const fileType =
      '.' + file.fileType.substring(file.fileType.indexOf('/') + 1);
    const matchesFileType = fileTypeFilter ? fileType === fileTypeFilter : true;

    const now = new Date();
    let createdStartDate: Date | null = null;
    if (createdAtFilter === 'Today') {
      createdStartDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
    } else if (createdAtFilter === 'Last Week') {
      createdStartDate = new Date();
      createdStartDate.setDate(now.getDate() - 7);
    } else if (createdAtFilter === 'Last Month') {
      createdStartDate = new Date();
      createdStartDate.setMonth(now.getMonth() - 1);
    }
    const fileCreatedAt = new Date(file.createdAt);
    const matchesCreatedAt = createdStartDate
      ? fileCreatedAt >= createdStartDate
      : true;

    let startDate: Date | null = null;
    if (modifiedAtFilter === 'Today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (modifiedAtFilter === 'Last Week') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    } else if (modifiedAtFilter === 'Last Month') {
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 1);
    }
    const fileModifiedAt = new Date(file.lastModifiedAt);
    const matchesModifiedAt = startDate ? fileModifiedAt >= startDate : true;

    return matchesFileType && matchesCreatedAt && matchesModifiedAt;
  });
}

export function useFolderPath(basePath: string) {
  const location = useLocation();
  const folderPath = location.pathname
    .replace(basePath, '')
    .split('/')
    .filter(Boolean);
  const currentFolderId = folderPath.length
    ? folderPath[folderPath.length - 1]
    : null;
  return { folderPath, currentFolderId };
}

type FilterState = {
  fileType: string | null;
  createdAt: string | null;
  modifiedAt: string | null;
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>({
    fileType: null,
    createdAt: null,
    modifiedAt: null,
  });

  const setFileTypeFilter = (type: string | null) =>
    setFilters((prev) => ({ ...prev, fileType: type }));

  const setCreatedAtFilter = (date: string | null) =>
    setFilters((prev) => ({ ...prev, createdAt: date }));

  const setModifiedAtFilter = (date: string | null) =>
    setFilters((prev) => ({ ...prev, modifiedAt: date }));

  const [filteredFiles, setFilteredFiles] = useState<FileComponentProps[]>([]);

  return {
    filters,
    setFileTypeFilter,
    setCreatedAtFilter,
    setModifiedAtFilter,
    filteredFiles,
    setFilteredFiles,
  };
}
