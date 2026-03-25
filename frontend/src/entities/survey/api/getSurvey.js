const API_URL = import.meta.env.VITE_API_URL || '/api';
export const getSurvey = async (id) => {
  const response = await fetch(`${API_URL}/survey/${id}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail);
  }

  return data;
}