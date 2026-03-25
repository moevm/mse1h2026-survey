import { useNavigateOnSubmit } from "../../../shared/lib"

import { useNavigate } from "react-router-dom";
import { submitAnswers } from "../../../entities/survey";

export const useSubmitSurvey = (survey, answers, isComplete) => {
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!isComplete || !survey) return;

    const searchParams = new URLSearchParams(window.location.search);
    const group = searchParams.get("group") || "";

    const payload = {
      survey_id: Number(survey.id),
      group: group,
      answers: survey.questions.map(function (question) {
        const value = answers[question.id];

        return {
          id_question: question.id,
          answer: Array.isArray(value) ? value : [String(value ?? "")],
        };
      }),
    };

    try {
      await submitAnswers(payload);
      navigate("/result");
    } catch (error) {
      console.error("Ошибка при отправке ответов:", error);
      alert(error.message || "Не удалось отправить ответы");
    }
  };

  return { handleSubmit };
};