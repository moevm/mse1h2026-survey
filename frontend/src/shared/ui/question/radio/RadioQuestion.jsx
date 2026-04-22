import { RadioItem } from '@shared/ui/radio'
import { List, ItemList } from '@shared/ui/list'
import { QuestionOptionGroup } from '../group/QuestionOptionGroup'
import styles from './RadioQuestion.module.css'

export const RadioQuestion = ({
  title,
  id,
  answers,
  value,
  onChange,
  error,
  disabled,
}) => {
  return (
    <QuestionOptionGroup
      title={title}
      id={id}
      error={error}
      disabled={disabled}
    >
      <List className={styles.answerList}>
        {answers.map((answer, idx) => {
          return (
            <ItemList style={{ width: '70%'}} key={answer}>
              <RadioItem
                id={`option-${id}-${idx}`}
                label={answer}
                checked={value === answer}
                onChange={() => onChange(answer)}
                disabled={disabled}
              />
            </ItemList>
          )}
        )}
      </List>
    </QuestionOptionGroup>
  );
}