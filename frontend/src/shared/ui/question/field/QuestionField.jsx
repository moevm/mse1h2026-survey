import { Card } from '@shared/ui/card'
import { Label } from '@shared/ui/label'
import clsx from 'clsx'
import styles from './QuestionField.module.css'

export const QuestionField = ({
  title,
  error,
  disabled,
  id,
  currentStep,
  totalSteps,
  isRequired,
  children,
  className,
  ...props
}) => {

  const cardClasses = clsx(
    styles.card, 
    className, {
    [styles.isInvalid]: !!error,
    [styles.isDisabled]: disabled,
  });

  return (
    <Card
      id={`question-${id}`}
      className={cardClasses}
      {...props}
    >
      <Label htmlFor={id} className={styles.title}>
        {`${currentStep}. ${title}`}
        {isRequired && <span className={styles.requiredMark}>*</span>}
      </Label>
      {children}
      <span className={styles.stepsBlock}>Вопрос {currentStep} из {totalSteps}</span>
    </Card>
  )
}
