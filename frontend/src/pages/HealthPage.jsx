import { useEffect, useState } from "react";
import { request } from "@shared/api/axios";

export const HealthPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHealth() {
      try {
        setIsLoading(true);
        setError("");
        
        const response = await request('get', '/health');
        setData(response.data || response); 
        
      } catch (e) {
        if (e.response) {
          const serverError = e.response.data?.detail || e.response.data?.message;
          setError(serverError || `Ошибка сервера: ${e.response.status}`);
        } 
        else if (e.request) {
          setError("Сервер не отвечает. Проверьте подключение.");
        } 
        else {
          setError(e.message || "Непредвиденная ошибка");
        }
        
        console.error("Health check error:", e);
      } finally {
        setIsLoading(false);
      }
    }

    loadHealth();
  }, []);

  if (isLoading) {
    return <div>Загрузка статуса сервисов...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  return (
    <div style={{ padding: "24px" }}>
      <h1>Состояние системы</h1>
      <p>
        Общий статус: <strong>{data.status}</strong>
      </p>

      <h2>Сервисы</h2>
      <ul>
        <li>
          Backend: <strong>{data.services.backend.status}</strong>
        </li>
        <li>
          Database: <strong>{data.services.database.status}</strong>
          {data.services.database.error ? (
            <div>Ошибка: {data.services.database.error}</div>
          ) : null}
        </li>
        <li>
          Frontend: <strong>up</strong>
        </li>
      </ul>
    </div>
  );
}