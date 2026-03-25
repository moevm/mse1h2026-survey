import { useParams } from "react-router-dom";
import { SurveyForm } from "../../widgets/survey-form";
import { SurveyNavigation } from "../../widgets/survey-navigation";
import { useSurvey, useSurveyAnswers } from "../../entities/survey";
import styles from "./SurveyPage.module.css";

export const SurveyPage = () => {
  const { id } = useParams();
  const { survey, isLoading, error } = useSurvey(id);

  const questions = survey ? survey.questions : [];
  const { answers, handleChange, isComplete } = useSurveyAnswers(questions);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>Ошибка: {error.message || "Не удалось загрузить опрос"}</div>;
  }

  if (!survey) {
    return <div>Опрос не найден</div>;
  }

  return (
    <div className={styles.layout}>
      <SurveyForm
        survey={survey}
        answers={answers}
        onAnswerChange={handleChange}
        isComplete={isComplete}
        className={styles.form}
      />

      <div className={styles.nav}>
        <SurveyNavigation
          questions={survey.questions}
          answers={answers}
        />
      </div>
    </div>
  );
};