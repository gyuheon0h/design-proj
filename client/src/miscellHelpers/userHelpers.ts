import axios from 'axios';

export async function getUsernameById(id: string): Promise<string> {
  try {
    const response = await axios.get(`http://localhost:5001/api/users/`, {
      params: { id },
    });

    return response.data?.username || '';
  } catch (error) {
    console.error('Error fetching username:', error);
    return ''; // Return empty string in case of an error
  }
}
