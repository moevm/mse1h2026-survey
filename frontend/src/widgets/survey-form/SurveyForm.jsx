import { useState } from 'react';
import { TitleCard } from '@shared/ui/card/TitleCard';
import { Question } from '@shared/ui/question';
import { Button } from '@shared/ui/button';
import { request } from '@shared/api/axios';
import image from '@shared/assets/images/survey_title.svg';
import clsx from 'clsx';
import styles from './SurveyForm.module.css';

const isAnswerFilled = (value) => {
  if (Array.isArray(value)) {
    return value.some((item) => String(item ?? '').trim());
  }

  return value !== undefined && String(value ?? '').trim() !== '';
};

const PASSING_QUESTION_TYPES = new Set(['radio', 'checkbox', 'scale', 'text']);

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
  } = survey;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isComplete || isSubmitting) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const group = searchParams.get('group') || '';

    const visibleQuestions = questions.filter((question) => (
      PASSING_QUESTION_TYPES.has(question.type)
    ));

    const payload = {
      survey_id: id,
      group,
      answers: visibleQuestions
        .filter((question) => question.type === 'text' || isAnswerFilled(answers[question.id]))
        .map((question) => {
          const value = answers[question.id];

          return {
            id_question: question.id,
            answer: Array.isArray(value) ? value : [String(value ?? '')]
          };
        })
    };

    setIsSubmitting(true);

    try {
      await request('POST', '/answers', payload);
      onFinish();
    } catch (error) {
      console.error('Ошибка при отправке ответов:', error);
      setIsSubmitting(false);
    }
  };

  const visibleQuestions = questions.filter((question) => (
    PASSING_QUESTION_TYPES.has(question.type)
  ));

  return (
    <form className={clsx(styles.wrapper, className)} onSubmit={handleSubmit}>
      <TitleCard
        image={image}
        title={title}
        description={description}
      />
      {visibleQuestions.map((question, idx) => (
        <Question
          key={question.id}
          {...question}
          currentStep={idx + 1}
          totalSteps={visibleQuestions.length}
          value={answers[question.id]}
          onChange={(value) => onAnswerChange(question.id, value)}
          disabled={isSubmitting || question.disabled}
        />
      ))}
      <Button
        type="submit"
        disabled={!isComplete || isSubmitting}
        className={styles.button}
      >
        {isSubmitting ? 'Отправка...' : 'Закончить опрос'}
      </Button>
    </form>
  );
};
