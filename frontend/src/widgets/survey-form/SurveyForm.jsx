import { SurveyTitleCard } from "./ui/SurveyTitleCard"
import { Question } from "../../entities/question"
import { Button } from "../../shared/ui/button"
import { useSubmitSurvey } from "../../features/submit-survey"
import image from '../../../public/survey_title.svg'
import styles from './SurveyForm.module.css'

export const SurveyForm = ({ 
  survey,
  answers,
  onAnswerChange,
  isComplete
}) => {
  const { handleSubmit } = useSubmitSurvey(answers, isComplete);

  const { 
    title,
    description,
    questions
  } = survey

  return (
    <div className={styles.wrapper}> 
      <SurveyTitleCard
        image={image}
        title={title}
        description={description}
      />
      {questions.map((question, idx) => {
        return (
          <Question
            key={question.id}
            {...question} 
            questionId={question.id}
            value={answers[question.id]}
            onChange={(value) => onAnswerChange(question.id, value)}
          />
        )
      })}
      <Button
        type="submit"
        disabled={!isComplete}
        onClick={handleSubmit}
        className={styles.button} 
      >
        Закончить опрос
      </Button>
    </div>
  );
}