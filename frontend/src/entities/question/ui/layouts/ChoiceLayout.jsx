import { Card } from '../../../../shared/ui/card';
import styles from './ChoiceLayout.module.css'

export const ChoiceLayout = ({
  title,
  questionId,
  error,
  disabled,
  children
}) => {
  return (
    <Card 
      as="fieldset"
      id={`question-${questionId}`} 
      className={styles.card}
      data-invalid={!!error}
      data-disabled={disabled}  
    >
      <legend className={styles.wrapper}>
        <span className={styles.title}>{title}</span>
        <span className={styles.divider}></span>
      </legend>
      {children}
    </Card>
  );
}