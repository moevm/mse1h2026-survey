const API_URL = import.meta.env.VITE_API_URL || '/api';

export const submitAnswers = async (payload) => {
  const response = await fetch(`${API_URL}/answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Не удалось отправить ответы";

    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch (e) {
      // ignore
    }

    throw new Error(message);
  }

  return response.json();
};