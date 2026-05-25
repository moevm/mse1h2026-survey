import { TitleCard } from '@shared/ui/card/TitleCard';
import { Question } from '@shared/ui/question';
import { Button } from '@shared/ui/button';
import { request } from '@shared/api/axios';
import image from '@shared/assets/images/survey_title.svg'
import clsx from 'clsx'
import styles from './SurveyForm.module.css'

const isAnswerFilled = (value) => {
  if (Array.isArray(value)) {
    return value.some((item) => String(item ?? '').trim())
  }

  return value !== undefined && String(value ?? '').trim() !== ''
}

const PASSING_QUESTION_TYPES = new Set(['radio', 'checkbox', 'scale', 'text'])

export const SurveyForm = ({ 
  survey,
  answers,
  onAnswerChange,
  isComplete,
  onFinish,
  className
}) => {
  const { 
    id,
    title,
    description,
    questions
  } = survey

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isComplete) return;

    const searchParams = new URLSearchParams(window.location.search)
    const group = searchParams.get("group") || "";

    const visibleQuestions = questions.filter((question) => (
      PASSING_QUESTION_TYPES.has(question.type)
    ))

    const payload = {
      survey_id: id,
      group,
      answers: visibleQuestions.filter((question) => isAnswerFilled(answers[question.id])).map((question) => {
        const value = answers[question.id];
        return {
          id_question: question.id,
          answer: Array.isArray(value) ? value : [String(value ?? "")],
        };
      }),
    };

    try {
      await request('POST', `/answers`, payload);
      onFinish();
    } catch (error) {
      console.error("Ошибка при отправке ответов:", error);
    }
  }

  return (
    <form className={clsx(styles.wrapper, className)} onSubmit={handleSubmit}> 
      <TitleCard
        image={image}
        title={title}
        description={description}
      />
      {questions.filter((question) => PASSING_QUESTION_TYPES.has(question.type)).map((question, idx, visibleQuestions) => {
        return (
          <Question
            key={question.id}
            {...question} 
            currentStep={idx + 1}
            totalSteps={visibleQuestions.length}
            value={answers[question.id]}
            onChange={(value) => onAnswerChange(question.id, value)}
          />
        )
      })}
      <Button
        type="submit"
        disabled={!isComplete}
        className={styles.button} 
      >
        Закончить опрос
      </Button>
    </form>
  );
}
