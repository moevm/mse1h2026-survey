import { Input } from '@shared/ui/input'
import { Label } from '@shared/ui/label'
import { List, ItemList } from '@shared/ui/list'
import { QuestionOptionGroup } from '../group/QuestionOptionGroup'
import styles from './CheckboxQuestion.module.css'

export const CheckboxQuestion = ({
  title,
  id,
  currentStep,
  totalSteps,
  answers = [],
  value = [],
  onChange,
  error,
  disabled,
}) => {
  const selectedValues = Array.isArray(value) ? value : []

  const handleToggle = (answer) => {
    if (selectedValues.includes(answer)) {
      onChange(selectedValues.filter((item) => item !== answer))
      return
    }

    onChange([...selectedValues, answer])
  }

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
          const checked = selectedValues.includes(answer)

          return (
            <ItemList style={{ width: '70%' }} key={answer}>
              <Label
                className={styles.item}
                data-checked={checked}
                data-invalid={!!error}
              >
                <Input
                  type="checkbox"
                  id={`option-${id}-${idx}`}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => handleToggle(answer)}
                  data-visually-hidden
                />
                <span className={styles.box} aria-hidden="true" />
                <span className={styles.label}>{answer}</span>
              </Label>
            </ItemList>
          )
        })}
      </List>
    </QuestionOptionGroup>
  )
}
