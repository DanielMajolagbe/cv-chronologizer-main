// API configuration
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://royacare-cv-api.onrender.com/'  // Replace with your actual Render service URL
  : 'http://localhost:3001';

export const sendCV = async (file: File, firstName: string, lastName: string): Promise<void> => {
  const formData = new FormData();
  formData.append('cv', file);
  formData.append('firstName', firstName);
  formData.append('lastName', lastName);

  const response = await fetch(`${API_URL}/api/send-cv`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to send CV');
  }
}; 