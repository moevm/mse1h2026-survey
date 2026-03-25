import { useEffect, useState } from "react";

export const HealthPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(function () {
    async function loadHealth() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/health", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Не удалось получить health status");
        }

        const result = await response.json();
        setData(result);
      } catch (e) {
        setError(e.message || "Ошибка загрузки статуса");
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
};