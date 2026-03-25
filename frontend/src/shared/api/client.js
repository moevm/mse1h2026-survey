const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiRequest(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options && options.headers ? options.headers : {}),
    },
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch (e) {
      // ignore json parse error
    }

    throw new Error(message);
  }

  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return null;
}

export async function getSurveyById(id) {
  return apiRequest(`/survey/${id}`, {
    method: 'GET',
  });
}

export async function submitAnswers(payload) {
  return apiRequest('/answers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}