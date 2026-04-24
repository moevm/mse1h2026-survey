import { QuestionField } from '../field/QuestionField';
import styles from './TextQuestion.module.css'

export const TextQuestion = ({
  title,
  id,
  error,
  disabled,
  value,
  onChange,
  placeholder = 'Заполните поле здесь ...',
}) => {
  return (
    <QuestionField
      title={title}
      id={id}
      error={error}
      disabled={disabled}
    >
      <textarea
        id={id}
        className={styles.textarea} 
        disabled={disabled}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </QuestionField>
  );
}