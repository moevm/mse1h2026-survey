import { Card } from '@shared/ui/card';
import clsx from 'clsx';
import styles from './QuestionOptionGroup.module.css'

export const QuestionOptionGroup = ({
  title,
  id,
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
        <span className={styles.title}>{title}</span>
        <span className={styles.divider}></span>
      </legend>
      {children}
    </Card>
  );
}