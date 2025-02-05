import axios from 'axios';

export async function getUsernameById(id: string): Promise<string> {
  try {
    const response = await axios.get(`http://localhost:5001/api/user/user`, {
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
