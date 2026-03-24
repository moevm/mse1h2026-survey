import { InputLayout } from "../layouts/InputLayout";
import styles from './TextQuestion.module.css'

export const TextQuestion = ({
  title,
  questionId,
  error,
  disabled,
  value,
  onChange,
  placeholder = 'Заполните поле здесь ...',
}) => {
  return (
    <InputLayout
      title={title}
      id={`question-${questionId}`}
      questionId={questionId}
      error={error}
      disabled={disabled}
    >
      <textarea
        id={questionId}
        className={styles.textarea} 
        disabled={disabled}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </InputLayout>
  );
}