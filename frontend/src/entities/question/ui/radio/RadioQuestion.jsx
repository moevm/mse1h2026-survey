import { RadioItem } from '../../../../shared/ui/radio/RadioItem'
import { AnswerList, AnswerItem } from '../answer-list/AnswerList'
import { ChoiceLayout } from '../layouts/ChoiceLayout'
import styles from './RadioQuestion.module.css'

export const RadioQuestion = ({
  title,
  questionId,
  answers,
  value,
  onChange,
  error,
  disabled,
}) => {
  return (
    <ChoiceLayout
      title={title}
      questionId={questionId}
      error={error}
      disabled={disabled}
    >
      <AnswerList className={styles.answerList}>
        {answers.map((answer, idx) => {
          return (
            <AnswerItem className={styles.answerItem} key={answer}>
              <RadioItem
                id={`option-${questionId}-${idx}`}
                label={answer}
                checked={value === answer}
                onChange={() => onChange(answer)}
                disabled={disabled}
              />
            </AnswerItem>
          )}
        )}
      </AnswerList>
    </ChoiceLayout>
  );
}