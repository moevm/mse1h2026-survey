import { QuestionOptionGroup } from '../group/QuestionOptionGroup';
import { Button } from '@shared/ui/button';
import { List, ItemList } from '@shared/ui/list';
import clsx from 'clsx'
import styles from './ScaleQuestion.module.css'

export const ScaleQuestion = ({
  title,
  id,
  currentStep,
  totalSteps,
  error,
  disabled,
  min,
  max,
  step,
  value,
  onChange,
  className
}) => {
  const items = [];
  for (let i = min; i <= max; i+= step) {
    items.push(i)
  }

  return (
    <QuestionOptionGroup
      title={title}
      id={id}
      currentStep={currentStep}
      totalSteps={totalSteps}
      error={error}
      disabled={disabled}
      className={className}
    >
      <List className={styles.scaleList}>
        {items.map((item) => {
          const buttonClass = clsx(styles.scaleButton, {
            [styles.scaleButtonSelected]: value === item
          })
          return (
            <ItemList key={item} className={styles.scaleItem}>
              <Button
                className={buttonClass}
                onClick={() => onChange(item)}
                disabled={disabled}
              >
                {item}
              </Button>
            </ItemList>
          )
        })}
      </List>
    </QuestionOptionGroup>
  );
}
