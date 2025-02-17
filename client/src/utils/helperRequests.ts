import axios from 'axios';

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

//TODO: @gyuheon this was for ur permissions dialog but idk if u ended up using it... should we delete this?

//given a list of userIds, return all the userNames associated
export async function fetchUserNames(
  userIds: string[],
): Promise<{ [key: string]: string }> {
  try {
    const userRequests = userIds.map((id) =>
      axios.get(`http://localhost:5001/api/user/`, { params: { id } }),
    );
    const userResponses = await Promise.all(userRequests);

    const userNames: { [key: string]: string } = {};
    userIds.forEach((id, index) => {
      userNames[id] = userResponses[index].data?.user?.username || '';
    });

    return userNames;
  } catch (error) {
    console.error('Error fetching user names:', error);
    return {};
  }
}
