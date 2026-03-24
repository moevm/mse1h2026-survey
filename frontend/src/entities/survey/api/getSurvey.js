export const getSurvey = async (id) => {
  const response = await fetch(`/api/surveys/${id}`)
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail);
  }

  return data;
}