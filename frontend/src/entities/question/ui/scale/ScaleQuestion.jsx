import { ChoiceLayout } from '../layouts/ChoiceLayout';
import { Button } from '../../../../shared/ui/button';
import { AnswerItem, AnswerList } from '../answer-list/AnswerList';
import styles from './ScaleQuestion.module.css'

export const ScaleQuestion = ({
  title,
  questionId,
  error,
  disabled,
  min,
  max,
  step,
  value,
  onChange
}) => {
  const items = [];
  for (let i = min; i <= max; i+= step) {
    items.push(i)
  }

  return (
    <ChoiceLayout
      title={title}
      questionId={questionId}
      error={error}
      disabled={disabled}
    >
      <AnswerList className={styles.scaleList}>
        {items.map((item, idx) => {
          const buttonClass = `
            ${styles.scaleButton}
            ${value === item ? styles.scaleButtonSelected : ''}
          `;
          return (
            <AnswerItem key={item} className={styles.scaleItem}>
              <Button
                className={buttonClass}
                onClick={() => onChange(item)}
                disabled={disabled}
              >
                {item}
              </Button>
            </AnswerItem>
          )
        })}
      </AnswerList>
    </ChoiceLayout>
  );
}