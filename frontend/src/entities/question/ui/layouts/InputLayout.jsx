import { Card } from '../../../../shared/ui/card'
import { Label } from '../../../../shared/ui/label'
import styles from './InputLayout.module.css'

export const InputLayout = ({
  title,
  error,
  disabled,
  id,
  questionId,
  children
}) => {
  return (
    <Card
      id={`question-${questionId}`}
      className={styles.card} 
      data-invalid={!!error} 
      data-disabled={disabled}
    >
      <Label htmlFor={id} className={styles.title}>
        {title}
      </Label>
      {children}
    </Card>
  )
}