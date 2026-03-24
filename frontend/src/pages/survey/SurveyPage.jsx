import { SurveyForm } from "../../widgets/survey-form";
import { SurveyNavigation } from "../../widgets/survey-navigation";
import { useSurveyAnswers } from "../../entities/survey";
import styles from './SurveyPage.module.css'

const MOCK_SURVEY = {
  title: "Опросник для теста",
  description: "Просим выбирать с умом",
  questions: [
    {
      id: 1,
      type: 'radio',
      title: 'Вопрос radio 1',
      answers: ['Да', 'Нет']
    },
    {
      id: 2,
      type: 'radio',
      title: 'Вопрос radio 2',
      answers: ['Да', 'Нет']
    },
    {
      id: 3,
      type: 'text',
      title: 'Вопрос text 1',
    },
    {
      id: 4,
      type: 'text',
      title: 'Вопрос text 2',
    },
    {
      id: 5,
      type: 'scale',
      title: 'Вопрос scale 1',
      min: 1,
      max: 10,
      step: 1
    },
    {
      id: 6,
      type: 'scale',
      title: 'Вопрос scale 2',
      min: 1,
      max: 10,
      step: 1
    }
  ]
}

export const SurveyPage = () => {
  const { answers, handleChange, isComplete } = useSurveyAnswers(MOCK_SURVEY.questions)
  return (
    <div className={styles.layout}>
      <SurveyForm 
        survey={MOCK_SURVEY}
        answers={answers}
        onAnswerChange={handleChange}
        isComplete={isComplete}
        className={styles.form}
      />
      <div className={styles.nav}>
        <SurveyNavigation
          questions={MOCK_SURVEY.questions}
          answers={answers}
        />
      </div>
    </div>
  );
}