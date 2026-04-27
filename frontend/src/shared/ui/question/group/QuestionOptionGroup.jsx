import { Card } from '@shared/ui/card';
import clsx from 'clsx';
import styles from './QuestionOptionGroup.module.css'

export const QuestionOptionGroup = ({
  title,
  id,
  currentStep,
  totalSteps,
  error,
  disabled,
  children,
  className
}) => {
  const cardClasses = clsx(styles.card, className, {
    [styles.isInvalid]: !!error,
    [styles.isDisabled]: disabled,
  })

  return (
    <Card 
      as="fieldset"
      id={`question-${id}`} 
      className={cardClasses}
    >
      <legend className={styles.wrapper}>
        <span className={styles.title}>{`${currentStep}. ${title}`}</span>
        <span className={styles.divider}></span>
      </legend>
      {children}
      <span className={styles.stepsBlock}>Вопрос {currentStep} из {totalSteps}</span>
    </Card>
  );
}