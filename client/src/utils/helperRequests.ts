import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { File } from '../interfaces/File';
import { Permission } from '../interfaces/Permission';

/**
 * This is a function that fetches a file for previewing by its GCS key.
 * @param gcsKey This is the key that was fetched.
 * @param fileType This is the type of the file that is going to be fetched.
 * @param fileId This is the id of the file that we are searching for.
 * @returns Returns a Blob formatted object, or an empty new blob if DNE.
 */
export async function getBlobGcskey(
  gcsKey: string,
  fileType: string,
  fileId: string,
): Promise<Blob> {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_BASE_URL}/api/file/${fileId}/view`,
      { gcsKey, fileType },
      { responseType: 'blob', withCredentials: true },
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
    const response = await axios.get(
      `${process.env.REACT_APP_API_BASE_URL}/api/user`,
      {
        params: { id },
      },
    );
    return response.data?.user.username || '';
  } catch (error) {
    console.error('Error fetching username:', error);
    return '';
  }
}

export async function getIsFavoritedByFileId(fileId: string): Promise<boolean> {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_BASE_URL}/api/user/permissions/${fileId}`,
      { withCredentials: true },
    );

    return response.data?.isFavorited || false;
  } catch (error) {
    console.error('Error fetching isFavorited status: ', error);
    return false;
  }
}

export async function getPermissionByFileId(
  fileId: string,
): Promise<Permission | undefined> {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_BASE_URL}/api/user/permissions/${fileId}`,
      { withCredentials: true },
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching permissions');
    return undefined;
  }
}

export async function downloadFile(
  fileId: string,
  fileName: string,
): Promise<void> {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_BASE_URL}/api/file/${fileId}/download`,
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
      axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/folder/foldername/${id}`,
      ),
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
  files: File[],
  fileTypeFilter: string | null,
  createdAtFilter: string | null,
  modifiedAtFilter: string | null,
): File[] {
  let filesArray: File[] = [];

  if (Array.isArray(files)) {
    filesArray = files;
  } else {
    filesArray =
      typeof files === 'object' &&
      files !== null &&
      'files' in files &&
      'permissions' in files
        ? (files as { files: File[]; permissions: any }).files
        : [];
  }

  return filesArray.filter((file) => {
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

  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);

  return {
    filters,
    setFileTypeFilter,
    setCreatedAtFilter,
    setModifiedAtFilter,
    filteredFiles,
    setFilteredFiles,
  };
}
