import { RadioItem } from '@shared/ui/radio'
import { List, ItemList } from '@shared/ui/list'
import { QuestionOptionGroup } from '../group/QuestionOptionGroup'

export const RadioQuestion = ({
  title,
  id,
  currentStep,
  totalSteps,
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
      currentStep={currentStep}
      totalSteps={totalSteps}
      error={error}
      disabled={disabled}
    >
      <List>
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