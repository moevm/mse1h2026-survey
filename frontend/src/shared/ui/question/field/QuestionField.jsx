import { Card } from '@shared/ui/card'
import { Label } from '@shared/ui/label'
import clsx from 'clsx'
import styles from './QuestionField.module.css'

export const QuestionField = ({
  title,
  error,
  disabled,
  id,
  children,
  ...props
}) => {

  const cardClasses = clsx(styles.card, {
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
        {title}
      </Label>
      {children}
    </Card>
  )
}