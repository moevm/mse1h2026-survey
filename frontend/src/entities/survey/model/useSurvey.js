import { useEffect, useState } from "react"
import { getSurvey } from "../api/getSurvey";

export const useSurvey = (id) => {
  const [survey, setSurvey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const loadSurvey = async () => {
      try {
        const data = await getSurvey(id);
        setSurvey(data)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false);
      }
    }
    loadSurvey();
  }, [id]);

  return {
    survey,
    isLoading,
    error
  }
}