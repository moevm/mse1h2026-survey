import { TitleCard } from '@shared/ui/card/TitleCard';
import { Question } from '@shared/ui/question';
import { Button } from '@shared/ui/button';
import { request } from '@shared/api/axios';
import image from '@shared/assets/images/survey_title.svg'
import clsx from 'clsx'
import styles from './SurveyForm.module.css'

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

    const payload = {
      survey_id: Number(id),
      group,
      answers: questions.map((question) => {
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
      {questions.map((question, idx) => {
        return (
          <Question
            key={question.id}
            {...question} 
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